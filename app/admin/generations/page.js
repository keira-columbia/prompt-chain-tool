import Link from "next/link";
import { createAdminClient } from "../../../lib/supabase/admin";

export default async function GenerationsPage() {
  const db = createAdminClient();
  const [requestsResult, responsesResult, chainsResult, modelsResult] = await Promise.all([
    db.from("generation_requests").select("*").order("created_at", { ascending: false }),
    db.from("llm_responses").select("*").order("created_at", { ascending: false }),
    db.from("prompt_chains").select("id,name"), db.from("llm_models").select("id,name"),
  ]);
  const requests = requestsResult.data ?? [], responses = responsesResult.data ?? [];
  const chains = Object.fromEntries((chainsResult.data ?? []).map(x => [x.id, x.name]));
  const models = Object.fromEntries((modelsResult.data ?? []).map(x => [x.id, x.name]));
  return <>
    <header className="page-head"><div><p>GENERATION OBSERVABILITY</p><h1>Requests and responses</h1><span>Trace every AI request from prompt chain through model response.</span></div><Link className="primary" href="/admin/manage/examples">Manage examples →</Link></header>
    <section className="rating-summary"><article><span>↗</span><b>{requests.length}</b><small>REQUESTS</small></article><article><span>✓</span><b>{responses.filter(x => x.status === "succeeded").length}</b><small>SUCCESSFUL</small></article><article><span>ms</span><b>{responses.length ? Math.round(responses.reduce((n,x) => n + (x.latency_ms || 0),0)/responses.length) : 0}</b><small>AVG LATENCY</small></article></section>
    <section className="table-panel"><div className="panel-title"><span>GENERATION REQUESTS</span><small>READ ONLY</small></div><table><thead><tr><th>Status</th><th>Prompt chain</th><th>Input</th><th>Created</th><th>Responses</th></tr></thead><tbody>{requests.map(item => <tr key={item.id}><td><span className="activity-type">{item.status}</span></td><td>{chains[item.prompt_chain_id] || "—"}</td><td className="decision">{item.input_text}</td><td>{new Date(item.created_at).toLocaleString()}</td><td>{responses.filter(x => x.generation_request_id === item.id).length}</td></tr>)}</tbody></table></section>
    <section className="table-panel spaced"><div className="panel-title"><span>LLM RESPONSES</span><small>READ ONLY</small></div><table><thead><tr><th>Model</th><th>Status</th><th>Response</th><th>Latency</th><th>Tokens</th></tr></thead><tbody>{responses.map(item => <tr key={item.id}><td>{models[item.model_id] || "Unregistered model"}</td><td>{item.status}</td><td className="decision">{item.response_text}</td><td>{item.latency_ms || "—"} ms</td><td>{item.token_count || "—"}</td></tr>)}</tbody></table></section>
  </>;
}
