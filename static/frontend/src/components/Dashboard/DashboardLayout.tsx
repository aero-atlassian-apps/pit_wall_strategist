import React from 'react'

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [left, center, right] = React.Children.toArray(children)
  return (
    <main className="dashboard-layout">
      <section className="panel-left">{left}</section>
      <section className="panel-center">{center}</section>
      <section className="panel-right">{right}</section>
    </main>
  )
}

export default DashboardLayout
