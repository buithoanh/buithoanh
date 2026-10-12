"use client";
import { useState } from "react";
import Link from "next/link";
import Icon from "../../components/Icon";

export default function ArticleFilter({ articles }) {
  const groups = ["Tất cả", ...new Set(articles.map((a) => a.nhom))];
  const [g, setG] = useState("Tất cả");
  const list = g === "Tất cả" ? articles : articles.filter((a) => a.nhom === g);
  return (
    <>
      {groups.length > 2 && (
        <div className="chips-pick" role="group" aria-label="Lọc theo chủ đề">
          {groups.map((x) => <button key={x} type="button" className={`pick${g === x ? " on" : ""}`} aria-pressed={g === x} onClick={() => setG(x)}>{x}</button>)}
        </div>
      )}
      <div className="art-grid mt">
        {list.map((a) => (
          <Link key={a.slug} className="art" href={`/cam-nang/${a.slug}/`}>
            <span className="chip">{a.nhom}</span>
            <h2>{a.title}</h2>
            <p>{a.description}</p>
            <span className="art-foot"><span className="meta">{a.ngay}</span><span className="more">Đọc bài <Icon name="arrow" size={16} /></span></span>
          </Link>
        ))}
      </div>
    </>
  );
}
