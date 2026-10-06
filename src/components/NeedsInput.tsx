import type { Machine } from "../../shared/machines.ts";
import { paneStorageId } from "../../shared/machines.ts";
import { useT } from "../lib/i18n.ts";
import { panesNeedingInput } from "../lib/needsInput.ts";
import { agentContext, agentTabName, paneMark, sidebarAgents, type SidebarAgent } from "../lib/sidebarAgents.ts";
import { AgentRowBody } from "./AgentSidebar.tsx";
import { displayPaneTitle } from "./Sidebar.tsx";
import "./NeedsInput.css";

export function NeedsInput({ machines, selectedMachineId, selectedPaneId, onSelect }: {
  machines: Machine[];
  selectedMachineId: string;
  selectedPaneId: string | null;
  onSelect(machineId: string, paneId: string): void;
}) {
  const t = useT();
  const waiting = panesNeedingInput(machines);
  const agentsByMachine = new Map<string, Map<string, SidebarAgent>>();
  const agentOf = (machine: Machine, paneId: string): SidebarAgent | undefined => {
    let agents = agentsByMachine.get(machine.id);
    if (!agents) {
      agents = new Map(sidebarAgents(machine.snapshot).map((entry) => [entry.pane.pane_id, entry]));
      agentsByMachine.set(machine.id, agents);
    }
    return agents.get(paneId);
  };
  return <>
    <p className="visually-hidden" role="status">{t("Panes waiting for input: {n}", { n: waiting.length })}</p>
    {waiting.length > 0 && <section className="needs-input" aria-label={t("Needs you")}>
    <h2 className="needs-input-heading sidebar-section-label">{t("Needs you")}</h2>
    <ul className="pane-list">
      {waiting.map(({ machine, pane, workspace }) => {
        const selected = machine.id === selectedMachineId && pane.pane_id === selectedPaneId;
        // the same words the pane has in Agents; a shell that waits has no agent to name
        const entry = agentOf(machine, pane.pane_id);
        const title = pane.label?.trim() || entry?.agent?.title?.trim() || pane.title?.trim() || displayPaneTitle(pane);
        const tabs = machine.snapshot?.tabs.filter((candidate) => candidate.workspace_id === workspace.workspace_id) ?? [];
        const tabName = agentTabName(tabs.find((candidate) => candidate.tab_id === pane.tab_id), tabs, t);
        const context = agentContext({ agentLabel: entry?.agentLabel ?? null, title, machineName: machines.length > 1 ? machine.name : null, workspaceLabel: workspace.label, tabName }).join(" · ");
        return <li className={`needs-input-item${selected ? " is-selected" : ""}`} key={paneStorageId(machine.id, pane.pane_id)}>
          <button type="button" className="agent-row" aria-current={selected ? "true" : undefined} onClick={() => onSelect(machine.id, pane.pane_id)}>
            <AgentRowBody mark={paneMark(entry)} title={title} context={context} backgroundTasks={entry?.pane.background_tasks} status={pane.agent_status} />
          </button>
        </li>;
      })}
    </ul>
    </section>}
  </>;
}
