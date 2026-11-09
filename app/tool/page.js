import { createAdminClient } from "../../lib/supabase/admin";
import { createChain, deleteChain, deleteStep, generateWithChain, moveStep, saveStep, updateChain } from "./actions";

export const dynamic = "force-dynamic";

export default async function PromptChainPage({ searchParams }) {
  const params = await searchParams;
  const db = createAdminClient();
  const [{ data: chains = [] }, { data: steps = [] }] = await Promise.all([
    db.from("prompt_chains").select("*").order("created_at"),
    db.from("prompt_chain_steps").select("*").order("step_order"),
  ]);
  const selected = chains.find((chain) => chain.id === params.chain) || chains[0] || null;
  const selectedSteps = selected ? steps.filter((step) => step.prompt_chain_id === selected.id) : [];

  return <>
    <header className="page-head"><div><p>PROMPT WORKSPACE</p><h1>Build prompt chains.</h1><span>Create, edit, reorder, test, and review multi-step AI workflows.</span></div><div className="count-pill">{chains.length} CHAINS · {steps.length} STEPS</div></header>
    {params.error && <div className="alert">{params.error}</div>}{params.saved && <div className="success">Changes saved.</div>}{params.deleted && <div className="success">Record deleted.</div>}
    <section className="tool-grid">
      <aside className="panel chain-nav"><div className="panel-title"><span>PROMPT CHAINS</span><small>SELECT ONE</small></div>{chains.map((chain) => <a className={selected?.id === chain.id ? "selected" : ""} href={`/tool?chain=${chain.id}`} key={chain.id}><b>{chain.name}</b><small>{steps.filter((step) => step.prompt_chain_id === chain.id).length} steps · {chain.is_active ? "active" : "paused"}</small></a>)}<form action={createChain} className="compact-form"><h3>New prompt chain</h3><label>NAME<input name="name" required /></label><label>DESCRIPTION<textarea name="description" required /></label><button className="primary" type="submit">Create chain →</button></form></aside>
      <div className="tool-content">
        {selected ? <>
          <section className="panel"><div className="panel-title"><span>CHAIN SETTINGS</span><small>CREATE / READ / UPDATE / DELETE</small></div><form action={updateChain} className="edit-form-inline"><input type="hidden" name="id" value={selected.id}/><label>NAME<input name="name" defaultValue={selected.name} required /></label><label>DESCRIPTION<textarea name="description" defaultValue={selected.description || ""} required /></label><label className="inline-check"><input type="checkbox" name="is_active" defaultChecked={selected.is_active}/> Active chain</label><button className="primary" type="submit">Save chain</button></form><form action={deleteChain} className="danger-inline"><input type="hidden" name="id" value={selected.id}/><button type="submit">Delete chain</button></form></section>
          <section className="panel spaced"><div className="panel-title"><span>CHAIN STEPS</span><small>REORDER WITH ↑ AND ↓</small></div><div className="step-stack">{selectedSteps.map((step, index) => <article className="step-editor" key={step.id}><strong>STEP {index + 1}</strong><form action={saveStep}><input type="hidden" name="id" value={step.id}/><input type="hidden" name="prompt_chain_id" value={selected.id}/><label>STEP NAME<input name="name" defaultValue={step.name} required /></label><label>INSTRUCTION<textarea name="instruction" defaultValue={step.instruction} required /></label><button className="ghost" type="submit">Save step</button></form><div className="step-actions"><form action={moveStep}><input type="hidden" name="id" value={step.id}/><input type="hidden" name="prompt_chain_id" value={selected.id}/><button name="direction" value="up" disabled={index === 0}>↑</button><button name="direction" value="down" disabled={index === selectedSteps.length - 1}>↓</button></form><form action={deleteStep}><input type="hidden" name="id" value={step.id}/><input type="hidden" name="prompt_chain_id" value={selected.id}/><button className="delete-small">Delete</button></form></div></article>)}</div><form action={saveStep} className="compact-form add-step"><input type="hidden" name="prompt_chain_id" value={selected.id}/><h3>Add a step</h3><label>STEP NAME<input name="name" required /></label><label>INSTRUCTION<textarea name="instruction" required /></label><button className="primary" type="submit">Add step →</button></form></section>
          <section className="panel spaced generation-box"><div><p className="eyebrow">RUN THIS CHAIN</p><h2>Generate text media</h2><p>The output of every step becomes the input to the next step.</p></div><form action={generateWithChain}><input type="hidden" name="prompt_chain_id" value={selected.id}/><label>STARTING INPUT<textarea name="input" placeholder="Describe the image or provide the text that should begin this chain." required /></label><button className="primary" type="submit" disabled={!selectedSteps.length}>Generate with {selected.name} →</button></form></section>
        </> : <section className="empty-state">Create your first prompt chain to begin.</section>}
      </div>
    </section>
  </>;
}
