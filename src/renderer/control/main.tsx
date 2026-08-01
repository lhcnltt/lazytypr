// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { createRoot } from "react-dom/client";

import "../styles.css";
import { ControlApp } from "./ControlApp.js";

const root = document.getElementById("root");
if (root !== null) createRoot(root).render(<ControlApp />);
