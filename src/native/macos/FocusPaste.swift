// SPDX-FileCopyrightText: 2024 OpenWhispr Team
// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT
// Adapted from resources/macos-fast-paste.swift at bf8b7e0b4e1de0c9779c63f4752bd80bdd39ee2c.
//
// The upstream activation and Command+V event approach is substantially adapted
// into lazytypr's bounded, request-scoped protocol. It intentionally accepts no
// clipboard text and never logs or persists application identity.

import AppKit
import ApplicationServices
import Foundation

private let protocolVersion = 1
private let maximumFrameBytes = 4096
private let operationDeadlineSeconds: TimeInterval = 2
private let invalidRequestId = "00000000-0000-4000-8000-000000000000"

private enum Outcome: String {
    case captured
    case pasted
    case targetMismatch = "target_mismatch"
    case activationDenied = "activation_denied"
    case permissionDenied = "permission_denied"
    case targetUnavailable = "target_unavailable"
    case timeout
    case helperError = "helper_error"
    case invalidRequest = "invalid_request"
}

private struct Target {
    let pid: pid_t
    let bundleId: String
    let capturedAt: String
}

private enum Request {
    case capture(requestId: String)
    case paste(requestId: String, target: Target)

    var requestId: String {
        switch self {
        case let .capture(requestId), let .paste(requestId, _):
            return requestId
        }
    }
}

private struct Response {
    let requestId: String
    let outcome: Outcome
    let target: Target?
}

private func exactKeys(_ dictionary: [String: Any], _ expected: Set<String>) -> Bool {
    Set(dictionary.keys) == expected
}

private func isCanonicalUuid(_ value: String) -> Bool {
    value.range(
        of: "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
        options: .regularExpression,
    ) != nil
}

private func isRfc3339UtcTimestamp(_ value: String) -> Bool {
    value.range(
        of: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$",
        options: .regularExpression,
    ) != nil
}

private func decodeRequest(_ bytes: Data) -> Result<Request, String> {
    guard bytes.count <= maximumFrameBytes,
          let frame = String(data: bytes, encoding: .utf8),
          frame.hasSuffix("\n"),
          frame.dropLast().contains("\n") == false,
          let payload = frame.dropLast().data(using: .utf8),
          let object = try? JSONSerialization.jsonObject(with: payload),
          let request = object as? [String: Any],
          let version = request["version"] as? Int,
          version == protocolVersion,
          let requestId = request["requestId"] as? String,
          isCanonicalUuid(requestId),
          let operation = request["operation"] as? String
    else {
        return .failure(invalidRequestId)
    }

    switch operation {
    case "capture":
        guard exactKeys(request, ["version", "requestId", "operation", "platform"]),
              request["platform"] as? String == "darwin"
        else {
            return .failure(requestId)
        }
        return .success(.capture(requestId: requestId))
    case "paste":
        guard exactKeys(request, ["version", "requestId", "operation", "target"]),
              let targetObject = request["target"] as? [String: Any],
              exactKeys(targetObject, ["platform", "pid", "bundleId", "capturedAt"]),
              targetObject["platform"] as? String == "darwin",
              let pid = targetObject["pid"] as? Int,
              pid > 0,
              let bundleId = targetObject["bundleId"] as? String,
              bundleId.isEmpty == false,
              let capturedAt = targetObject["capturedAt"] as? String,
              isRfc3339UtcTimestamp(capturedAt)
        else {
            return .failure(requestId)
        }
        return .success(.paste(requestId: requestId, target: Target(
            pid: pid_t(pid),
            bundleId: bundleId,
            capturedAt: capturedAt,
        )))
    default:
        return .failure(requestId)
    }
}

private func isLazytypr(_ bundleId: String) -> Bool {
    bundleId.lowercased().hasPrefix("com.lazytypr")
}

private func currentTarget() -> Target? {
    guard let application = NSWorkspace.shared.frontmostApplication,
          let bundleId = application.bundleIdentifier,
          application.processIdentifier > 0,
          isLazytypr(bundleId) == false
    else {
        return nil
    }
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return Target(
        pid: application.processIdentifier,
        bundleId: bundleId,
        capturedAt: formatter.string(from: Date()),
    )
}

private func matches(_ target: Target, _ application: NSRunningApplication?) -> Bool {
    guard let application,
          application.processIdentifier == target.pid,
          application.bundleIdentifier == target.bundleId,
          isLazytypr(target.bundleId) == false
    else {
        return false
    }
    return true
}

private func isDeadlineExceeded(_ startedAt: Date) -> Bool {
    Date().timeIntervalSince(startedAt) > operationDeadlineSeconds
}

private func dispatchPaste() -> Bool {
    guard let source = CGEventSource(stateID: .combinedSessionState),
          let commandDown = CGEvent(keyboardEventSource: source, virtualKey: 0x37, keyDown: true),
          let vDown = CGEvent(keyboardEventSource: source, virtualKey: 0x09, keyDown: true),
          let vUp = CGEvent(keyboardEventSource: source, virtualKey: 0x09, keyDown: false),
          let commandUp = CGEvent(keyboardEventSource: source, virtualKey: 0x37, keyDown: false)
    else {
        return false
    }
    vDown.flags = .maskCommand
    vUp.flags = .maskCommand
    commandDown.post(tap: .cghidEventTap)
    vDown.post(tap: .cghidEventTap)
    vUp.post(tap: .cghidEventTap)
    commandUp.post(tap: .cghidEventTap)
    return true
}

private func handle(_ request: Request) -> Response {
    switch request {
    case let .capture(requestId):
        guard let target = currentTarget() else {
            return Response(requestId: requestId, outcome: .targetUnavailable, target: nil)
        }
        return Response(requestId: requestId, outcome: .captured, target: target)
    case let .paste(requestId, target):
        let startedAt = Date()
        guard AXIsProcessTrusted() else {
            return Response(requestId: requestId, outcome: .permissionDenied, target: nil)
        }
        guard matches(target, NSRunningApplication(processIdentifier: target.pid)) else {
            return Response(requestId: requestId, outcome: .targetUnavailable, target: nil)
        }
        if isDeadlineExceeded(startedAt) {
            return Response(requestId: requestId, outcome: .timeout, target: nil)
        }
        if matches(target, NSWorkspace.shared.frontmostApplication) == false {
            guard let application = NSRunningApplication(processIdentifier: target.pid),
                  application.activate(options: [])
            else {
                return Response(requestId: requestId, outcome: .activationDenied, target: nil)
            }
        }
        if isDeadlineExceeded(startedAt) {
            return Response(requestId: requestId, outcome: .timeout, target: nil)
        }
        guard matches(target, NSWorkspace.shared.frontmostApplication),
              matches(target, NSRunningApplication(processIdentifier: target.pid))
        else {
            return Response(requestId: requestId, outcome: .targetMismatch, target: nil)
        }
        guard dispatchPaste() else {
            return Response(requestId: requestId, outcome: .helperError, target: nil)
        }
        return Response(requestId: requestId, outcome: .pasted, target: nil)
    }
}

private func encodeResponse(_ response: Response) -> Data? {
    var object: [String: Any] = [
        "version": protocolVersion,
        "requestId": response.requestId,
        "outcome": response.outcome.rawValue,
    ]
    if let target = response.target {
        object["target"] = [
            "platform": "darwin",
            "pid": Int(target.pid),
            "bundleId": target.bundleId,
            "capturedAt": target.capturedAt,
        ]
    }
    guard let encoded = try? JSONSerialization.data(withJSONObject: object, options: [.sortedKeys]) else {
        return nil
    }
    return encoded + Data("\n".utf8)
}

private func write(_ response: Response) {
    let output = encodeResponse(response) ?? Data("{\"outcome\":\"helper_error\"}\n".utf8)
    guard output.count <= maximumFrameBytes else {
        return
    }
    FileHandle.standardOutput.write(output)
    if response.outcome != .captured && response.outcome != .pasted {
        FileHandle.standardError.write(Data("\(response.outcome.rawValue)\n".utf8))
    }
}

let input = FileHandle.standardInput.readDataToEndOfFile()
switch decodeRequest(input) {
case let .success(request):
    write(handle(request))
case let .failure(requestId):
    write(Response(requestId: requestId, outcome: .invalidRequest, target: nil))
}
