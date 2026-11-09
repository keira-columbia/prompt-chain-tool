import { createAdminClient } from "../../../lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function GenerationsPage({ searchParams }) {
  const params = await searchParams; const db = createAdminClient();
  const [{ data: chains = [] }, { data: requests = [] }, { data: responses = [] }] = await Promise.all([
    db.from("prompt_chains").select("id,name").order("name"),
    db.from("generation_requests").select("*").order("created_at", { ascending: false }),
    db.from("llm_responses").select("*").order("created_at", { ascending: false }),
  ]);
  const visible = params.chain ? requests.filter((request) => request.prompt_chain_id === params.chain) : requests;
  const names = Object.fromEntries(chains.map((chain) => [chain.id, chain.name]));
  return <><header className="page-head"><div><p>GENERATED MEDIA</p><h1>Review every output.</h1><span>Inspect text media produced by a specific prompt chain.</span></div><a className="primary" href="/tool">Build a chain →</a></header>{params.generated && <div className="success">Generation completed.</div>}<div className="filter-links"><a className={!params.chain ? "selected" : ""} href="/tool/generations">All chains</a>{chains.map((chain) => <a className={params.chain === chain.id ? "selected" : ""} href={`/tool/generations?chain=${chain.id}`} key={chain.id}>{chain.name}</a>)}</div><section className="generation-list">{visible.map((request) => { const response = responses.find((item) => item.generation_request_id === request.id); return <article className="panel" key={request.id}><div className="panel-title"><span>{names[request.prompt_chain_id] || "Deleted chain"}</span><small>{request.status} · {new Date(request.created_at).toLocaleString()}</small></div><h3>Starting input</h3><p>{request.input_text}</p><h3>Generated media</h3><pre>{response?.response_text || "No response recorded."}</pre></article>; })}{!visible.length && <div className="empty-state">No generated media for this selection yet.</div>}</section></>;
}
