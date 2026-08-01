/*
 * SPDX-FileCopyrightText: 2024 OpenWhispr Team
 * SPDX-FileCopyrightText: 2026 lhcnltt
 * SPDX-License-Identifier: MIT
 * Adapted from resources/windows-fast-paste.c at bf8b7e0b4e1de0c9779c63f4752bd80bdd39ee2c.
 *
 * This is intentionally a narrow protocol helper. It never receives clipboard
 * text, does not inspect executable paths, and never selects another target.
 */

#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "focus_paste.h"

#define FOREGROUND_POLL_TIMEOUT_MS 750
#define FOREGROUND_POLL_INTERVAL_MS 15
#define REQUEST_ID_LENGTH 36
#define TIMESTAMP_LENGTH 24
#define HANDLE_TEXT_LENGTH 32

typedef enum FocusOutcome {
    OUTCOME_CAPTURED,
    OUTCOME_PASTED,
    OUTCOME_TARGET_MISMATCH,
    OUTCOME_ACTIVATION_DENIED,
    OUTCOME_PERMISSION_DENIED,
    OUTCOME_TARGET_UNAVAILABLE,
    OUTCOME_TIMEOUT,
    OUTCOME_HELPER_ERROR,
    OUTCOME_INVALID_REQUEST
} FocusOutcome;

typedef struct Cursor {
    const char *data;
    size_t length;
    size_t position;
} Cursor;

typedef struct Target {
    DWORD pid;
    char window_handle[HANDLE_TEXT_LENGTH];
    char captured_at[TIMESTAMP_LENGTH + 1];
} Target;

typedef struct Request {
    char request_id[REQUEST_ID_LENGTH + 1];
    char operation[8];
    Target target;
    BOOL has_request_id;
    BOOL has_target;
} Request;

static const WORD MODIFIER_KEYS[] = {
    VK_LCONTROL, VK_RCONTROL, VK_LSHIFT, VK_RSHIFT,
    VK_LMENU, VK_RMENU, VK_LWIN, VK_RWIN
};

static void skip_whitespace(Cursor *cursor) {
    while (cursor->position < cursor->length) {
        const char character = cursor->data[cursor->position];
        if (character != ' ' && character != '\t' && character != '\r' && character != '\n') {
            break;
        }
        cursor->position += 1;
    }
}

static BOOL consume_character(Cursor *cursor, char expected) {
    skip_whitespace(cursor);
    if (cursor->position >= cursor->length || cursor->data[cursor->position] != expected) {
        return FALSE;
    }
    cursor->position += 1;
    return TRUE;
}

static BOOL read_json_string(Cursor *cursor, char *destination, size_t destination_size) {
    size_t written = 0;

    if (destination_size == 0 || !consume_character(cursor, '\"')) {
        return FALSE;
    }
    while (cursor->position < cursor->length) {
        const unsigned char character = (unsigned char)cursor->data[cursor->position];
        cursor->position += 1;
        if (character == '\"') {
            destination[written] = '\0';
            return TRUE;
        }
        if (character < 0x20U || character == '\\' || written + 1 >= destination_size) {
            return FALSE;
        }
        destination[written] = (char)character;
        written += 1;
    }
    return FALSE;
}

static BOOL read_positive_dword(Cursor *cursor, DWORD *value) {
    uint64_t parsed = 0;
    BOOL saw_digit = FALSE;

    skip_whitespace(cursor);
    while (cursor->position < cursor->length && cursor->data[cursor->position] >= '0' && cursor->data[cursor->position] <= '9') {
        saw_digit = TRUE;
        parsed = (parsed * 10U) + (uint64_t)(cursor->data[cursor->position] - '0');
        if (parsed > UINT32_MAX) {
            return FALSE;
        }
        cursor->position += 1;
    }
    if (!saw_digit || parsed == 0U) {
        return FALSE;
    }
    *value = (DWORD)parsed;
    return TRUE;
}

static BOOL is_valid_uuid(const char *value) {
    size_t index;

    if (strlen(value) != REQUEST_ID_LENGTH) {
        return FALSE;
    }
    for (index = 0; index < REQUEST_ID_LENGTH; index += 1) {
        const char character = value[index];
        if (index == 8 || index == 13 || index == 18 || index == 23) {
            if (character != '-') {
                return FALSE;
            }
        } else if (!((character >= '0' && character <= '9') || (character >= 'a' && character <= 'f') || (character >= 'A' && character <= 'F'))) {
            return FALSE;
        }
    }
    return TRUE;
}

static BOOL is_valid_timestamp(const char *value) {
    static const size_t separators[] = {4, 7, 10, 13, 16, 19, 23};
    static const char expected[] = {'-', '-', 'T', ':', ':', '.', 'Z'};
    size_t index;

    if (strlen(value) != TIMESTAMP_LENGTH) {
        return FALSE;
    }
    for (index = 0; index < sizeof(separators) / sizeof(separators[0]); index += 1) {
        if (value[separators[index]] != expected[index]) {
            return FALSE;
        }
    }
    for (index = 0; index < TIMESTAMP_LENGTH; index += 1) {
        if (index == 4 || index == 7 || index == 10 || index == 13 || index == 16 || index == 19 || index == 23) {
            continue;
        }
        if (value[index] < '0' || value[index] > '9') {
            return FALSE;
        }
    }
    return TRUE;
}

static BOOL is_valid_handle_text(const char *value) {
    size_t index;

    if (strlen(value) < 3 || strlen(value) >= HANDLE_TEXT_LENGTH || value[0] != '0' || (value[1] != 'x' && value[1] != 'X')) {
        return FALSE;
    }
    for (index = 2; value[index] != '\0'; index += 1) {
        const char character = value[index];
        if (!((character >= '0' && character <= '9') || (character >= 'a' && character <= 'f') || (character >= 'A' && character <= 'F'))) {
            return FALSE;
        }
    }
    return TRUE;
}

static BOOL parse_target(Cursor *cursor, Target *target) {
    BOOL saw_platform = FALSE;
    BOOL saw_pid = FALSE;
    BOOL saw_handle = FALSE;
    BOOL saw_captured_at = FALSE;

    if (!consume_character(cursor, '{')) {
        return FALSE;
    }
    for (;;) {
        char key[16];
        if (!read_json_string(cursor, key, sizeof(key)) || !consume_character(cursor, ':')) {
            return FALSE;
        }
        if (strcmp(key, "platform") == 0 && !saw_platform) {
            char platform[8];
            if (!read_json_string(cursor, platform, sizeof(platform)) || strcmp(platform, "win32") != 0) {
                return FALSE;
            }
            saw_platform = TRUE;
        } else if (strcmp(key, "pid") == 0 && !saw_pid) {
            if (!read_positive_dword(cursor, &target->pid)) {
                return FALSE;
            }
            saw_pid = TRUE;
        } else if (strcmp(key, "windowHandle") == 0 && !saw_handle) {
            if (!read_json_string(cursor, target->window_handle, sizeof(target->window_handle)) || !is_valid_handle_text(target->window_handle)) {
                return FALSE;
            }
            saw_handle = TRUE;
        } else if (strcmp(key, "capturedAt") == 0 && !saw_captured_at) {
            if (!read_json_string(cursor, target->captured_at, sizeof(target->captured_at)) || !is_valid_timestamp(target->captured_at)) {
                return FALSE;
            }
            saw_captured_at = TRUE;
        } else {
            return FALSE;
        }
        if (consume_character(cursor, '}')) {
            break;
        }
        if (!consume_character(cursor, ',')) {
            return FALSE;
        }
    }
    return saw_platform && saw_pid && saw_handle && saw_captured_at;
}

static BOOL parse_request(const char *input, size_t input_length, Request *request) {
    Cursor cursor = {input, input_length, 0};
    BOOL saw_version = FALSE;
    BOOL saw_request_id = FALSE;
    BOOL saw_operation = FALSE;
    BOOL saw_platform = FALSE;

    if (!consume_character(&cursor, '{')) {
        return FALSE;
    }
    for (;;) {
        char key[16];
        if (!read_json_string(&cursor, key, sizeof(key)) || !consume_character(&cursor, ':')) {
            return FALSE;
        }
        if (strcmp(key, "version") == 0 && !saw_version) {
            DWORD version;
            if (!read_positive_dword(&cursor, &version) || version != FOCUS_PASTE_PROTOCOL_VERSION) {
                return FALSE;
            }
            saw_version = TRUE;
        } else if (strcmp(key, "requestId") == 0 && !saw_request_id) {
            if (!read_json_string(&cursor, request->request_id, sizeof(request->request_id)) || !is_valid_uuid(request->request_id)) {
                return FALSE;
            }
            request->has_request_id = TRUE;
            saw_request_id = TRUE;
        } else if (strcmp(key, "operation") == 0 && !saw_operation) {
            if (!read_json_string(&cursor, request->operation, sizeof(request->operation)) || (strcmp(request->operation, "capture") != 0 && strcmp(request->operation, "paste") != 0)) {
                return FALSE;
            }
            saw_operation = TRUE;
        } else if (strcmp(key, "platform") == 0 && !saw_platform) {
            char platform[8];
            if (!read_json_string(&cursor, platform, sizeof(platform)) || strcmp(platform, "win32") != 0) {
                return FALSE;
            }
            saw_platform = TRUE;
        } else if (strcmp(key, "target") == 0 && !request->has_target) {
            if (!parse_target(&cursor, &request->target)) {
                return FALSE;
            }
            request->has_target = TRUE;
        } else {
            return FALSE;
        }
        if (consume_character(&cursor, '}')) {
            break;
        }
        if (!consume_character(&cursor, ',')) {
            return FALSE;
        }
    }
    skip_whitespace(&cursor);
    if (cursor.position != cursor.length || !saw_version || !saw_request_id || !saw_operation) {
        return FALSE;
    }
    if (strcmp(request->operation, "capture") == 0) {
        return saw_platform && !request->has_target;
    }
    return !saw_platform && request->has_target;
}

static const char *outcome_name(FocusOutcome outcome) {
    switch (outcome) {
        case OUTCOME_CAPTURED: return "captured";
        case OUTCOME_PASTED: return "pasted";
        case OUTCOME_TARGET_MISMATCH: return "target_mismatch";
        case OUTCOME_ACTIVATION_DENIED: return "activation_denied";
        case OUTCOME_PERMISSION_DENIED: return "permission_denied";
        case OUTCOME_TARGET_UNAVAILABLE: return "target_unavailable";
        case OUTCOME_TIMEOUT: return "timeout";
        case OUTCOME_HELPER_ERROR: return "helper_error";
        case OUTCOME_INVALID_REQUEST: return "invalid_request";
        default: return "helper_error";
    }
}

static void emit_outcome(const char *request_id, FocusOutcome outcome, const Target *target) {
    const char *safe_request_id = request_id == NULL ? "00000000-0000-0000-0000-000000000000" : request_id;
    const char *name = outcome_name(outcome);

    if (outcome == OUTCOME_CAPTURED && target != NULL) {
        (void)printf("{\"version\":1,\"requestId\":\"%s\",\"outcome\":\"captured\",\"target\":{\"platform\":\"win32\",\"pid\":%lu,\"windowHandle\":\"%s\",\"capturedAt\":\"%s\"}}\n", safe_request_id, (unsigned long)target->pid, target->window_handle, target->captured_at);
    } else {
        (void)printf("{\"version\":1,\"requestId\":\"%s\",\"outcome\":\"%s\"}\n", safe_request_id, name);
    }
    (void)fflush(stdout);
    if (outcome != OUTCOME_CAPTURED && outcome != OUTCOME_PASTED) {
        (void)fprintf(stderr, "%s\n", name);
        (void)fflush(stderr);
    }
}

static FocusOutcome check_target_access(HWND window, DWORD expected_pid) {
    DWORD actual_pid = 0;
    HANDLE process;
    HANDLE token;
    TOKEN_ELEVATION elevation;
    DWORD received = 0;

    if (!IsWindow(window)) {
        return OUTCOME_TARGET_UNAVAILABLE;
    }
    if (GetWindowThreadProcessId(window, &actual_pid) == 0 || actual_pid != expected_pid) {
        return OUTCOME_TARGET_MISMATCH;
    }
    process = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, actual_pid);
    if (process == NULL) {
        return OUTCOME_PERMISSION_DENIED;
    }
    if (!OpenProcessToken(process, TOKEN_QUERY, &token)) {
        (void)CloseHandle(process);
        return OUTCOME_PERMISSION_DENIED;
    }
    if (!GetTokenInformation(token, TokenElevation, &elevation, sizeof(elevation), &received) || received != sizeof(elevation)) {
        (void)CloseHandle(token);
        (void)CloseHandle(process);
        return OUTCOME_PERMISSION_DENIED;
    }
    (void)CloseHandle(token);
    (void)CloseHandle(process);
    return elevation.TokenIsElevated != 0U ? OUTCOME_PERMISSION_DENIED : OUTCOME_PASTED;
}

static BOOL write_timestamp(char *destination, size_t destination_size) {
    SYSTEMTIME now;
    int written;

    GetSystemTime(&now);
    written = sprintf_s(destination, destination_size, "%04u-%02u-%02uT%02u:%02u:%02u.%03uZ", now.wYear, now.wMonth, now.wDay, now.wHour, now.wMinute, now.wSecond, now.wMilliseconds);
    return written == TIMESTAMP_LENGTH;
}

static FocusOutcome capture_target(Target *target) {
    HWND foreground = GetForegroundWindow();
    DWORD pid = 0;
    FocusOutcome access;

    if (foreground == NULL) {
        return OUTCOME_TARGET_UNAVAILABLE;
    }
    if (GetWindowThreadProcessId(foreground, &pid) == 0 || pid == 0) {
        return OUTCOME_TARGET_UNAVAILABLE;
    }
    access = check_target_access(foreground, pid);
    if (access != OUTCOME_PASTED) {
        return access;
    }
    target->pid = pid;
    if (sprintf_s(target->window_handle, sizeof(target->window_handle), "0x%llX", (unsigned long long)(uintptr_t)foreground) < 3 || !write_timestamp(target->captured_at, sizeof(target->captured_at))) {
        return OUTCOME_HELPER_ERROR;
    }
    return OUTCOME_CAPTURED;
}

static BOOL parse_handle(const char *handle_text, HWND *window) {
    char *end = NULL;
    unsigned long long parsed;

    if (!is_valid_handle_text(handle_text)) {
        return FALSE;
    }
    parsed = strtoull(handle_text, &end, 16);
    if (end == NULL || *end != '\0' || parsed == 0U) {
        return FALSE;
    }
    *window = (HWND)(uintptr_t)parsed;
    return TRUE;
}

static FocusOutcome activate_exact_target(HWND window, DWORD pid) {
    DWORD target_thread;
    DWORD current_thread = GetCurrentThreadId();
    BOOL attached = FALSE;
    DWORD started_at;
    FocusOutcome access;

    access = check_target_access(window, pid);
    if (access != OUTCOME_PASTED) {
        return access;
    }
    target_thread = GetWindowThreadProcessId(window, NULL);
    if (target_thread == 0) {
        return OUTCOME_TARGET_UNAVAILABLE;
    }
    if (IsIconic(window) && !ShowWindowAsync(window, SW_RESTORE)) {
        return OUTCOME_ACTIVATION_DENIED;
    }
    if (target_thread != current_thread) {
        if (!AttachThreadInput(current_thread, target_thread, TRUE)) {
            return OUTCOME_ACTIVATION_DENIED;
        }
        attached = TRUE;
    }
    if (!SetForegroundWindow(window)) {
        if (attached) {
            (void)AttachThreadInput(current_thread, target_thread, FALSE);
        }
        return OUTCOME_ACTIVATION_DENIED;
    }
    if (attached && !AttachThreadInput(current_thread, target_thread, FALSE)) {
        return OUTCOME_HELPER_ERROR;
    }
    started_at = GetTickCount();
    while (GetForegroundWindow() != window) {
        if (GetTickCount() - started_at >= FOREGROUND_POLL_TIMEOUT_MS) {
            return OUTCOME_TIMEOUT;
        }
        Sleep(FOREGROUND_POLL_INTERVAL_MS);
    }
    return check_target_access(window, pid);
}

static BOOL any_modifier_held(void) {
    size_t index;

    for (index = 0; index < sizeof(MODIFIER_KEYS) / sizeof(MODIFIER_KEYS[0]); index += 1) {
        if ((GetAsyncKeyState(MODIFIER_KEYS[index]) & 0x8000) != 0) {
            return TRUE;
        }
    }
    return FALSE;
}

static FocusOutcome is_terminal_window(HWND window, BOOL *terminal) {
    wchar_t class_name[256];
    const int length = GetClassNameW(window, class_name, (int)(sizeof(class_name) / sizeof(class_name[0])));

    if (length == 0) {
        return OUTCOME_HELPER_ERROR;
    }
    *terminal = lstrcmpiW(class_name, L"ConsoleWindowClass") == 0 || lstrcmpiW(class_name, L"CASCADIA_HOSTING_WINDOW_CLASS") == 0;
    return OUTCOME_PASTED;
}

static FocusOutcome send_paste(HWND window) {
    INPUT inputs[6];
    BOOL terminal = FALSE;
    UINT input_count;
    UINT sent;
    FocusOutcome classification;

    if (any_modifier_held()) {
        return OUTCOME_ACTIVATION_DENIED;
    }
    classification = is_terminal_window(window, &terminal);
    if (classification != OUTCOME_PASTED) {
        return classification;
    }
    input_count = terminal ? 6U : 4U;
    SecureZeroMemory(inputs, sizeof(inputs));
    inputs[0].type = INPUT_KEYBOARD;
    inputs[0].ki.wVk = VK_LCONTROL;
    inputs[1].type = INPUT_KEYBOARD;
    inputs[1].ki.wVk = terminal ? VK_LSHIFT : 'V';
    inputs[2].type = INPUT_KEYBOARD;
    inputs[2].ki.wVk = terminal ? 'V' : 'V';
    inputs[3].type = INPUT_KEYBOARD;
    inputs[3].ki.wVk = 'V';
    inputs[3].ki.dwFlags = KEYEVENTF_KEYUP;
    if (terminal) {
        inputs[4].type = INPUT_KEYBOARD;
        inputs[4].ki.wVk = VK_LSHIFT;
        inputs[4].ki.dwFlags = KEYEVENTF_KEYUP;
        inputs[5].type = INPUT_KEYBOARD;
        inputs[5].ki.wVk = VK_LCONTROL;
        inputs[5].ki.dwFlags = KEYEVENTF_KEYUP;
    } else {
        inputs[2].ki.dwFlags = KEYEVENTF_KEYUP;
        inputs[3].type = INPUT_KEYBOARD;
        inputs[3].ki.wVk = VK_LCONTROL;
        inputs[3].ki.dwFlags = KEYEVENTF_KEYUP;
    }
    sent = SendInput(input_count, inputs, sizeof(INPUT));
    SecureZeroMemory(inputs, sizeof(inputs));
    return sent == input_count ? OUTCOME_PASTED : OUTCOME_HELPER_ERROR;
}

int main(void) {
    char input[FOCUS_PASTE_PROTOCOL_MAX_BYTES + 1];
    Request request;
    size_t bytes_read;
    FocusOutcome outcome;
    HWND target_window;

    SecureZeroMemory(input, sizeof(input));
    SecureZeroMemory(&request, sizeof(request));
    bytes_read = fread(input, 1, sizeof(input), stdin);
    if (bytes_read == 0 || bytes_read > FOCUS_PASTE_PROTOCOL_MAX_BYTES || input[bytes_read - 1] != '\n' || memchr(input, '\0', bytes_read) != NULL) {
        emit_outcome(NULL, OUTCOME_INVALID_REQUEST, NULL);
        SecureZeroMemory(input, sizeof(input));
        return 0;
    }
    input[bytes_read - 1] = '\0';
    if (!parse_request(input, bytes_read - 1, &request)) {
        emit_outcome(request.has_request_id ? request.request_id : NULL, OUTCOME_INVALID_REQUEST, NULL);
        SecureZeroMemory(input, sizeof(input));
        SecureZeroMemory(&request, sizeof(request));
        return 0;
    }
    if (strcmp(request.operation, "capture") == 0) {
        outcome = capture_target(&request.target);
        emit_outcome(request.request_id, outcome, outcome == OUTCOME_CAPTURED ? &request.target : NULL);
    } else if (!parse_handle(request.target.window_handle, &target_window)) {
        emit_outcome(request.request_id, OUTCOME_INVALID_REQUEST, NULL);
    } else {
        outcome = activate_exact_target(target_window, request.target.pid);
        if (outcome == OUTCOME_PASTED) {
            outcome = send_paste(target_window);
        }
        emit_outcome(request.request_id, outcome, NULL);
    }
    SecureZeroMemory(input, sizeof(input));
    SecureZeroMemory(&request, sizeof(request));
    return 0;
}
