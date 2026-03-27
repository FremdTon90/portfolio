import './SectionFrame.css'

export default function SectionFrame({
  sectionId,
  className = '',
  children,
}) {
  return (
    <section
      id={sectionId}
      className={`section-frame ${className}`.trim()}
      data-section-id={sectionId}
    >
      {children}
    </section>
  )
}