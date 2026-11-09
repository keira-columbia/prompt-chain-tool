import { createAdminClient } from "../../../lib/supabase/admin";
import { updateMix } from "./actions";

export default async function PromptsPage({ searchParams }) {
  const params = await searchParams;
  const db = createAdminClient();
  const [chainsResult, stepsResult, mixResult] = await Promise.all([
    db.from("prompt_chains").select("*").order("name"),
    db.from("prompt_chain_steps").select("*").order("step_order"),
    db.from("prompt_chain_mix").select("*").eq("id", 1).maybeSingle(),
  ]);
  const chains = chainsResult.data ?? [];
  const steps = stepsResult.data ?? [];
  const mix = mixResult.data || { relevance_weight: 45, humor_weight: 35, novelty_weight: 20 };
  return <>
    <header className="page-head"><div><p>PROMPT OPERATIONS</p><h1>Prompt chains</h1><span>Inspect every generation sequence, its steps, and the live quality mix.</span></div><div className="count-pill">{chains.length} CHAINS · {steps.length} STEPS</div></header>
    {params?.error && <div className="alert">{params.error}</div>}{params?.saved && <div className="success">Prompt-chain mix updated.</div>}
    <section className="table-panel prompt-table"><div className="panel-title"><span>ALL PROMPT CHAINS</span><small>SELECT A ROW TO REVIEW ITS STEPS</small></div><table><thead><tr><th>Chain</th><th>Purpose</th><th>Steps</th><th>Status</th></tr></thead><tbody>{chains.map(chain=><tr key={chain.id}><td><a href={`#chain-${chain.id}`}>{chain.name}</a></td><td>{chain.description}</td><td>{steps.filter(step=>step.prompt_chain_id===chain.id).length}</td><td><span className={chain.is_active?"role admin":"role"}>{chain.is_active?"ACTIVE":"PAUSED"}</span></td></tr>)}</tbody></table></section>
    <section className="prompt-layout spaced"><div className="chain-list">{chains.map(chain => <article className="chain-card" id={`chain-${chain.id}`} key={chain.id}><div className="panel-title"><span>{chain.name}</span><small>{chain.is_active ? "ACTIVE" : "PAUSED"}</small></div><p>{chain.description}</p><ol>{steps.filter(step => step.prompt_chain_id === chain.id).map(step => <li key={step.id}><b>{step.name}</b><span>{step.instruction}</span></li>)}</ol></article>)}</div>
    <div><div className="mix-scope"><small>CONFIGURATION APPLIES TO</small><b>Caption Quality Review</b><span>Used to score every generated caption. It does not change one individual meme.</span></div><form className="edit-form sticky-form" action={updateMix}><input type="hidden" name="mix_id" value={mix.id || 1}/><div className="panel-title"><span>CAPTION QUALITY MIX</span><small>READ / UPDATE</small></div><p className="muted">Edit this named review configuration. The three values must total 100.</p>{[["relevance_weight","Relevance"],["humor_weight","Humor"],["novelty_weight","Novelty"]].map(([name,label]) => <label key={name}>{label.toUpperCase()} %<input name={name} type="number" min="0" max="100" defaultValue={mix[name]} required/></label>)}<button className="primary wide">Update Caption Quality Review →</button></form><div className="table-panel mix-table spaced"><div className="panel-title"><span>EXISTING MIXES</span><small>1 CONFIGURATION</small></div><table><thead><tr><th>Applies to</th><th>Relevance</th><th>Humor</th><th>Novelty</th></tr></thead><tbody><tr><td>Caption Quality Review</td><td>{mix.relevance_weight}%</td><td>{mix.humor_weight}%</td><td>{mix.novelty_weight}%</td></tr></tbody></table></div></div></section>
  </>;
}
