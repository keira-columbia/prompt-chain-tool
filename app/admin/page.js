import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "../../lib/supabase/admin";

export const dynamic="force-dynamic";
export default async function Dashboard(){
  const db=createAdminClient();
  const [profilesResult,momentsResult,captionsResult,captionVotesResult,ratingsResult]=await Promise.all([
    db.from("profiles").select("id,first_name,last_name"),
    db.from("moments").select("id,title,zone,user_id,created_at,image_url").order("created_at",{ascending:false}),
    db.from("captions").select("id,moment_id"),db.from("caption_votes").select("id,moment_id,user_id,created_at"),db.from("moment_ratings").select("id,moment_id,user_id,value,created_at")
  ]);
  const profiles=profilesResult.data??[];
  const moments=momentsResult.data??[];
  const captions=captionsResult.data??[];
  const captionVotes=captionVotesResult.data??[];
  const ratings=ratingsResult.data??[];
  const engagement=captionVotes.length+ratings.length;
  const zoneCounts=Object.entries(moments.reduce((all,m)=>({...all,[m.zone]:(all[m.zone]||0)+1}),{})).sort((a,b)=>b[1]-a[1]);
  const activeUsers=new Set([...captionVotes.map(v=>v.user_id),...ratings.map(v=>v.user_id)]).size;
  const top=moments.map(moment=>{const mine=ratings.filter(r=>r.moment_id===moment.id);return {...moment,score:mine.reduce((n,r)=>n+r.value,0),votes:mine.length+captionVotes.filter(v=>v.moment_id===moment.id).length};}).sort((a,b)=>b.score-a.score||b.votes-a.votes).slice(0,5);
  return <><header className="page-head"><div><p>OPERATIONS OVERVIEW</p><h1>Community pulse</h1><span>Live statistics from the Campus Survival database.</span></div><Link className="primary" href="/admin/media/new">＋ Generate media</Link></header><section className="metrics"><Link href="/admin/users"><small>PROFILES</small><b>{profiles.length}</b><em>registered accounts · Open →</em></Link><Link className="acid" href="/admin/media"><small>AI MEDIA</small><b>{moments.length}</b><em>{captions.length} captions generated · Open →</em></Link><Link href="/admin/ratings"><small>TOTAL SIGNALS</small><b>{engagement}</b><em>ratings + caption votes · Open →</em></Link><Link href="/admin/ratings"><small>ACTIVE VOTERS</small><b>{activeUsers}</b><em>participating accounts · Open →</em></Link></section><section className="dash-grid"><Link href="/admin/media" className="panel dashboard-link"><div className="panel-title"><span>ZONE DISTRIBUTION</span><small>{moments.length} TOTAL · VIEW MEDIA →</small></div><div className="bars">{zoneCounts.map(([zone,count])=><div key={zone}><label><span>{zone}</span><b>{count}</b></label><i><u style={{width:`${Math.max(8,count/Math.max(1,moments.length)*100)}%`}}/></i></div>)}</div></Link><Link href="/admin/ratings" className="panel dashboard-link"><div className="panel-title"><span>ENGAGEMENT RATE</span><small>VIEW RATINGS →</small></div><div className="ring" style={{"--value":`${Math.min(100,Math.round(engagement/Math.max(1,moments.length*2)*100))}%`}}><b>{Math.round(engagement/Math.max(1,moments.length))}</b><span>actions<br/>per post</span></div></Link></section><section className="panel leaderboard"><div className="panel-title"><span>TOP MEDIA</span><Link href="/admin/media">Manage all →</Link></div>{top.map((item,index)=><Link className="leader-row" href={`/admin/media/${item.id}`} key={item.id}><b>{String(index+1).padStart(2,"0")}</b><Image src={item.image_url} alt="" width={70} height={48} unoptimized/><span><strong>{item.title}</strong><small>{item.zone} · {item.votes} interactions</small></span><em>{item.score>=0?'+':''}{item.score}</em></Link>)}</section></>;
}
