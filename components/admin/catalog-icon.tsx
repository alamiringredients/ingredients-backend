import type {ReactNode} from 'react'

export type IconName = 'people'|'roles'|'calendar'|'clock'|'add'|'arrow-left'|'box'|'category'|'check'|'delete'|'down'|'download'|'edit'|'external'|'save'|'up'

export function Icon({name}: {name:IconName}) {
  const paths:Record<IconName,ReactNode> = {
    calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    people:<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    roles:<><path d="M12 3 4 6v5c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6l-8-3Z"/><path d="m9 12 2 2 4-5"/></>,
    add:<path d="M12 5v14M5 12h14" />,
    'arrow-left':<path d="m15 18-6-6 6-6" />,
    box:<><path d="m21 8-9 5-9-5M3 8l9-5 9 5v8l-9 5-9-5Z" /><path d="M12 13v8" /></>,
    category:<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    check:<path d="m5 12 4 4L19 6" />,
    delete:<><path d="M4 7h16M9 7V4h6v3M18 7l-1 13H7L6 7M10 11v5M14 11v5" /></>,
    down:<path d="m6 9 6 6 6-6" />,
    download:<><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></>,
    edit:<><path d="M13.5 6.5 17.5 10.5M4 20l4.5-1 10-10a2.8 2.8 0 0 0-4-4l-10 10L4 20Z" /></>,
    external:<><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" /></>,
    save:<><path d="M5 4h12l2 2v14H5V4Z" /><path d="M8 4v6h8V4M8 20v-6h8v6" /></>,
    up:<path d="m6 15 6-6 6 6" />,
  }
  return <svg className="admin-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}
