import { useId, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import type { Machine } from "../../shared/machines.ts";
import { paneStorageId } from "../../shared/machines.ts";
import { useT } from "../lib/i18n.ts";
import { sidebarAgents } from "../lib/sidebarAgents.ts";
import { customTabLabel, tabLabel } from "../lib/tabName.ts";
import { AgentMark } from "./AgentMark.tsx";
import { BackgroundBadge, displayPaneTitle, StatusBadge } from "./Sidebar.tsx";
import "./AgentSidebar.css";

export interface AgentSidebarProps {
  machines: Machine[];
  selectedMachineId: string;
  selectedPaneId: string | null;
  onSelect(machineId: string, paneId: string): void;
}

/** All PCs' live agents form a second list; workspace and PC folds do not hide these rows. */
export function AgentSidebar({ machines, selectedMachineId, selectedPaneId, onSelect }: AgentSidebarProps) {
  const t = useT();
  const listId = useId();
  const [collapsed, setCollapsed] = useState(false);
  const rows = useMemo(() => machines.flatMap((machine) =>
    sidebarAgents(machine.snapshot).map((entry) => ({ machine, ...entry })),
  ), [machines]);
  return <section className={`agents-sidebar${collapsed ? " is-collapsed" : ""}${rows.length === 0 ? " is-empty" : ""}`} aria-label={t("Agents")}>
    <button type="button" className="agent-section-toggle" aria-expanded={!collapsed} aria-controls={listId} onClick={() => setCollapsed(!collapsed)}>
      <span>{t("Agents")}</span>
      {collapsed ? <ChevronRight aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
      <span className="agent-section-count">{rows.length}</span>
    </button>
    <div className="agent-list-contents" id={listId} hidden={collapsed}>
      {rows.length === 0 ? <p className="agent-empty" role="status">{t("No agents running")}</p> : <ul className="agent-list">
        {rows.map(({ machine, pane, workspace, tab, agent, canonicalAgent, agentLabel }) => {
          const selected = machine.id === selectedMachineId && pane.pane_id === selectedPaneId;
          const online = machine.state === "connected";
          const title = pane.label?.trim() || agent?.title?.trim() || pane.title?.trim() || displayPaneTitle(pane);
          const tabs = machine.snapshot?.tabs.filter((candidate) => candidate.workspace_id === workspace.workspace_id) ?? [];
          const tabName = tab && (tabs.length > 1 || customTabLabel(tab)) ? tabLabel(tab, t, tabs.findIndex((candidate) => candidate.tab_id === tab.tab_id) + 1) : null;
          const context = [machine.name, workspace.label, tabName, agentLabel && agentLabel !== title ? agentLabel : null].filter(Boolean).join(" · ");
          const tooltip = [...new Set([pane.pane_id, title, context, agent?.name, agent?.display_agent, pane.cwd].filter(Boolean))].join("\n");
          return <li className={`agent-item${selected ? " is-selected" : ""}${online ? "" : " is-offline"}`} key={paneStorageId(machine.id, pane.pane_id)} data-machine={machine.id} data-pane={pane.pane_id}>
            <button type="button" className="agent-select" disabled={!online} aria-current={selected ? "true" : undefined} title={tooltip} onClick={() => onSelect(machine.id, pane.pane_id)}>
              <span className="agent-row-mark" aria-hidden="true"><AgentMark agent={canonicalAgent ?? ""} size={18} /></span>
              <span className="agent-copy">
                <span className="agent-title">{title}</span>
                <span className="agent-context">{context}</span>
              </span>
              <span className="agent-row-status"><BackgroundBadge count={pane.background_tasks} /><StatusBadge status={pane.agent_status} compact /></span>
            </button>
          </li>;
        })}
      </ul>}
    </div>
  </section>;
}
