export const userInfo = (id: number, username: string | undefined, karma: number, approved_media_count: number, total: number, percent: string | null, data: any, rejected_media_count: number) => 
`👤 <b>User Info</b>
🆔 <code>${id}</code>
👤 <a href="tg://user?id=${id}">@${username}</a>
☯️ Karma: ${karma}
✅ Approved Media: ${approved_media_count}
🚫 Rejected Media: ${rejected_media_count}
📥 Sent Media: ${total}
📥 Approval Rate: ${percent === "NaN" ? 0 : percent}%
⚠️ Warnings: ${data.warnings}
⛔️ Banned: ${data.banned ? "Yes" : "No"}`;