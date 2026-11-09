import { notFound } from "next/navigation";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { getResourceConfig } from "../../../../lib/week7-resources";
import { saveResource, deleteResource } from "../actions";

function Input({ field, value, options = [] }) {
  if (field.type === "textarea") return <textarea name={field.name} defaultValue={value || ""} maxLength={field.maxLength} required={field.required}/>;
  if (field.type === "checkbox") return <input className="check" name={field.name} type="checkbox" defaultChecked={value ?? true}/>;
  if (field.type === "relation") return <select name={field.name} defaultValue={value || ""} required={field.required}><option value="" disabled>Select a provider</option>{options.map(option => <option value={option.id} key={option.id}>{option.name}</option>)}</select>;
  return <input name={field.name} type={field.type === "uuid" ? "text" : field.type || "text"} defaultValue={value || ""} maxLength={field.maxLength} placeholder={field.placeholder} required={field.required}/>;
}

export default async function ResourcePage({ params, searchParams }) {
  const { resource } = await params;
  const query = await searchParams;
  const config = getResourceConfig(resource);
  if (!config) notFound();
  const db = createAdminClient();
  let request = db.from(config.table).select("*").order(config.order, { ascending: !config.descending });
  const { data, error } = await request;
  const rows = data ?? [];
  const relationFields = config.fields.filter(field => field.type === "relation");
  const relationOptions = {};
  for (const field of relationFields) relationOptions[field.name] = (await db.from(field.relationTable).select("id,name").order("name")).data ?? [];
  const edit = rows.find(row => row.id === query?.edit);
  return <>
    <header className="page-head"><div><p>{config.eyebrow}</p><h1>{config.title}</h1><span>{config.description}</span></div><div className="count-pill">{rows.length} RECORDS</div></header>
    {(query?.error || error) && <div className="alert">{query?.error || error.message}</div>}
    {query?.saved && <div className="success">Changes saved.</div>}
    {query?.deleted && <div className="success">Record deleted.</div>}
    <section className="manager-grid">
      <form className="edit-form sticky-form" action={saveResource}>
        <input type="hidden" name="resource" value={resource}/><input type="hidden" name="id" value={edit?.id || ""}/>
        <div className="panel-title"><span>{edit ? "EDIT RECORD" : "CREATE RECORD"}</span>{edit && <a href={`/admin/manage/${resource}`}>Cancel</a>}</div>
        {config.fields.map(field => <label key={field.name}>{field.label.toUpperCase()}<Input field={field} value={edit?.[field.name]} options={relationOptions[field.name]}/></label>)}
        <button className="primary wide">{edit ? "Save changes" : "Create record"} →</button>
      </form>
      <div className="resource-list">
        {rows.map(row => <article className="resource-card" key={row.id}>
          <div><small>{row.category || row.model_key || row.domain || row.email || (row.active === false ? "INACTIVE" : "ACTIVE")}</small><h2>{row.term || row.title || row.name || row.domain || row.email}</h2><p>{row.definition || row.output_text || row.base_url || row.input_prompt || "Configured record"}</p></div>
          <div className="row-actions"><a className="ghost" href={`/admin/manage/${resource}?edit=${row.id}`}>Edit</a><form action={deleteResource}><input type="hidden" name="resource" value={resource}/><input type="hidden" name="id" value={row.id}/><button className="delete-small">Delete</button></form></div>
        </article>)}
        {!rows.length && <div className="empty-state">No records yet. Create the first one using the form.</div>}
      </div>
    </section>
  </>;
}
