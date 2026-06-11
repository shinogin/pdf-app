import { useState, useRef } from "react"
import { PDFDocument } from "pdf-lib"
import * as pdfjsLib from "pdfjs-dist"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href

function SortableItem({ page, pdfFiles, index, moveUp, moveDown, removePage }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        padding: "10px",
        marginBottom: "10px",
        border: "1px solid gray",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: isDragging ? "#f0f0f0" : "white",
        userSelect: "none",
      }}
    >
      <div
        {...attributes}
        {...listeners}
        style={{ cursor: "grab", padding: "0 8px", color: "#aaa", fontSize: "18px" }}
      >
        â ¿
      </div>
      {page.thumbnail && (
        <img
          src={page.thumbnail}
          style={{ height: "80px", border: "1px solid #ccc", flexShrink: 0 }}
          alt=""
        />
      )}
      <span style={{ flex: 1 }}>
        {pdfFiles[page.fileId]?.name} - {page.pageIndex + 1}ãã¼ã¸
      </span>
      <button onClick={() => moveUp(index)}>â</button>
      <button onClick={() => moveDown(index)} style={{ marginLeft: "4px" }}>â</button>
      <button onClick={() => removePage(index)} style={{ marginLeft: "4px" }}>åé¤</button>
    </div>
  )
}

function SeoContent() {
  const [openFaq, setOpenFaq] = useState(null)
  const faqs = [
    { q: "å®å¨ç¡æã§ä½¿ãã¾ããï¼", a: "ã¯ããå®å¨ç¡æã§ããä¼å¡ç»é²ãã¯ã¬ã¸ããã«ã¼ããä¸è¦ã§ãããµã¦ã®æ©è½ãå¶éãªããä½¿ãããã ãã¾ãã" },
    { q: "ãã¡ã¤ã«ã¯ãµã¼ãã¼ã«ã¢ããã­ã¼ãããã¾ããï¼", a: "ããã¾ããããã®ãã¼ã«ã¯ãã¹ã¦ãã©ã¦ã¶åï¼ãä½¿ãã®ç«¯æ«ä¸ï¼ã§åä½ãã¾ããPDFãã¡ã¤ã«ãå¤é¨ãµã¼ãã¼ã«éä¿¡ããããã¨ã¯ä¸åããã¾ããã®ã§ãæ©å¯ææ¸ãå®å¨ã«ãä½¿ãããã ãã¾ãã" },
    { q: "ä½ãã¼ã¸ã¾ã§ã»ä½ãã¡ã¤ã«ã¾ã§çµåã§ãã¾ããï¼", a: "ãã¼ã¸æ°ã»ãã¡ã¤ã«æ°ã«å¶éã¯ããã¾ãããããããéå¸¸ã«å¤§ããªãã¡ã¤ã«ã®å ´åã¯ãã©ã¦ã¶ã®ã¡ã¢ãªç¶æ³ã«ãã£ã¦ã¯å¦çã«æéããããå ´åãããã¾ãã" },
    { q: "å¯¾å¿ãã¦ãããã©ã¦ã¶ã¯ï¼", a: "Google ChromeãMozilla FirefoxãMicrosoft EdgeãSafariï¼ææ°çï¼ã«å¯¾å¿ãã¦ãã¾ããã¹ãã¼ããã©ã³ã»ã¿ãã¬ããã®ãã©ã¦ã¶ã§ããå©ç¨ããã ãã¾ãã" },
    { q: "ãã¼ã¸ã®é çªã¯èªç±ã«å¤ãããã¾ããï¼", a: "ã¯ãããã©ãã°ï¼ãã­ãã§ã§èªç±ã«ä¸¦ã¹æ¿ããã§ãã¾ããã¾ãââãã¿ã³ã§ã®ç§»åãããã¼ã¸åä½ã®åé¤ã«ãå¯¾å¿ãã¦ãã¾ãã" },
  ]
  const s = {
    wrap: { maxWidth: "780px", margin: "0 auto", fontFamily: "sans-serif", color: "#333", lineHeight: "1.7" },
    section: { marginTop: "48px", paddingTop: "32px", borderTop: "1px solid #eee" },
    h2: { fontSize: "20px", fontWeight: "700", marginBottom: "16px", color: "#111" },
    features: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "16px" },
    card: { background: "#fff8f8", border: "1px solid #f0d0d0", borderRadius: "8px", padding: "16px" },
    cardTitle: { fontWeight: "700", fontSize: "15px", marginBottom: "8px", color: "#c41e1e" },
    steps: { counterReset: "step", listStyle: "none", padding: "0", marginTop: "16px" },
    step: { display: "flex", gap: "16px", marginBottom: "16px", alignItems: "flex-start" },
    stepNum: { background: "#c41e1e", color: "#fff", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", flexShrink: "0", fontSize: "14px" },
    faqItem: { borderBottom: "1px solid #eee" },
    faqQ: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", cursor: "pointer", fontWeight: "600", fontSize: "15px" },
    faqA: { padding: "0 0 14px", color: "#555", fontSize: "14px" },
  }
  return (
    <div style={s.wrap}>
      <section style={s.section} aria-labelledby="features-heading">
        <h2 id="features-heading" style={s.h2}>ãã®ãã¼ã«ã®ç¹å¾´</h2>
        <div style={s.features}>
          <div style={s.card}>
            <div style={s.cardTitle}>ð ãã¡ã¤ã«ã¯ç«¯æ«ããåºãªã</div>
            <p style={{ margin: 0, fontSize: "14px" }}>ãã¹ã¦ã®å¦çã¯ãã©ã¦ã¶åã§å®çµãPDFãå¤é¨ãµã¼ãã¼ã«éä¿¡ããããã¨ã¯ä¸åããã¾ããã</p>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>ð å®å¨ç¡æã»ç»é²ä¸è¦</div>
            <p style={{ margin: 0, fontSize: "14px" }}>ä¼å¡ç»é²ãã¤ã³ã¹ãã¼ã«ãä¸è¦ããã©ã¦ã¶ã§éãã ãã§PDFã®çµåãç¡æã§ã§ãã¾ãã</p>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>ð ãã¼ã¸åä½ã§ä¸¦ã¹æ¿ã</div>
            <p style={{ margin: 0, fontSize: "14px" }}>è¤æ°ã®PDFããã¼ã¸åä½ã§èª­ã¿è¾¼ã¿ããµã ãã¤ã«ãç¢ºèªããªããèªç±ã«é åºãå¤ãã¦çµåã§ãã¾ãã</p>
          </div>
        </div>
      </section>

      <section style={s.section} aria-labelledby="howto-heading">
        <h2 id="howto-heading" style={s.h2}>ä½¿ãæ¹ï¼3ã¹ãããï¼</h2>
        <ol style={s.steps}>
          {[
            ["PDFãè¿½å ", "ä¸ã®ã¨ãªã¢ã«PDFãã¡ã¤ã«ããã©ãã°ï¼ãã­ãã§ãªããããã¡ã¤ã«ãé¸æãããè¤æ°ã®PDFãé¸ã³ã¾ãã"],
            ["ãã¼ã¸ãä¸¦ã¹æ¿ã", "èª­ã¿è¾¼ãã PDFããã¼ã¸ä¸è¦§ã¨ãã¦è¡¨ç¤ºããã¾ãããµã ãã¤ã«ãç¢ºèªããªããããã©ãã°ã¾ãã¯ââãã¿ã³ã§é çªãæ´ãã¾ããä¸è¦ãªãã¼ã¸ã¯ãåé¤ãã§é¤å¤ã§ãã¾ãã"],
            ["PDFãçµåã»ãc¦ã³ã­ã¼ã", "ãPDFãçµåããã¿ã³ãæ¼ãã¨ãä¸¦ã¹æ¿ããé ã«ãã¼ã¸ãçµåããã¦ãã¦ã³ã­ã¼ãããã¾ãã"],
          ].map(([title, desc], i) => (
            <li key={i} style={s.step}>
              <span style={s.stepNum}>{i + 1}</span>
              <div><strong>{title}</strong><br /><span style={{ fontSize: "14px", color: "#555" }}>{desc}</span></div>
            </li>
          ))}
        </ol>
      </section>

      <section style={s.section} aria-labelledby="faq-heading">
        <h2 id="faq-heading" style={s.h2}>ããããè³ªå</h2>
        <dl>
          {faqs.map((faq, i) => (
            <div key={i} style={s.faqItem}>
              <dt
                style={s.faqQ}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                role="button"
                aria-expanded={openFaq === i}
              >
                <span>Q. {faq.q}</span>
                <span style={{ fontSize: "18px", color: "#c41e1e" }}>{openFaq === i ? "â" : "+"}</span>
              </dt>
              {openFaq === i && (
                <dd style={s.faqA}>A. {faq.a}</dd>
              )}
            </div>
          ))}
        </dl>
      </section>

      <section style={{ ...s.section, marginBottom: "48px" }} aria-labelledby="about-heading">
        <h2 id="about-heading" style={s.h2}>PDFçµåãã¼ã«ã«ã¤ãã¦</h2>
        <p style={{ fontSize: "14px", color: "#555" }}>
          ãã®PDFçµåãã¼ã«ã¯ãè¤æ°ã®PDFãã¡ã¤ã«ãç¡æã§ãªã³ã©ã¤ã³ã«çµåï¼ã®ã¼ã¸ï¼ã§ããWebã¢ããªã§ãã
          pdf-libããã³pdfjs-distãä½¿ç¨ããã¯ã©ã¤ã¢ã³ããµã¤ãå¦çã«ããããã¡ã¤ã«ã¯ä¸åãµã¼ãã¼ã«éä¿¡ããã¾ããã
          ãã¼ã¸åä½ã§ã®ä¸¦ã¹æ¿ãã»åé¤ã«å¯¾å¿ãã¦ããããµã ãã¤ã«ãã¬ãã¥ã¼ã§åå®¹ãç¢ºèªããªããç·¨éã§ãã¾ãã
          å¥ç´æ¸ã»è«æ±æ¸ã»å ±åæ¸ãªã©ãæ©å¯æ§ã®é«ãPDFã­çµåã«ãå®å¿ãã¦ãå©ç¨ããã ãã¾ãã
        </p>
      </section>
    </div>
  )
}

function App() {
  const [pdfFiles, setPdfFiles] = useState({})
  const [pages, setPages] = useState([])
  const nextId = useRef(0)

  const genId = () => String(nextId.current++)

  const addFiles = async (fileList) => {
    const newPdfFiles = {}
    const newPages = []

    for (const file of fileList) {
      if (!file.name.endsWith(".pdf")) continue
      const bytes = await file.arrayBuffer()
      let pageCount = 1
      try {
        const pdf = await PDFDocument.load(bytes)
        pageCount = pdf.getPageCount()
      } catch {
        continue
      }
      const fileId = genId()
      newPdfFiles[fileId] = { name: file.name, bytes }

      const pdfjsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise

      for (let i = 0; i < pageCount; i++) {
        let thumbnail = null
        try {
          const pdfjsPage = await pdfjsDoc.getPage(i + 1)
          const viewport = pdfjsPage.getViewport({ scale: 0.3 })
          const canvas = document.createElement("canvas")
          canvas.width = viewport.width
          canvas.height = viewport.height
          const ctx = canvas.getContext("2d")
          await pdfjsPage.render({ canvasContext: ctx, viewport }).promise
          thumbnail = canvas.toDataURL()
        } catch {}

        newPages.push({ id: genId(), fileId, pageIndex: i, thumbnail })
      }
    }

    setPdfFiles((prev) => ({ ...prev, ...newPdfFiles }))
    setPages((prev) => [...prev, ...newPages])
  }

  const moveUp = (index) => {
    if (index === 0) return
    const newPages = [...pages]
    ;[newPages[index - 1], newPages[index]] = [newPages[index], newPages[index - 1]]
    setPages(newPages)
  }

  const moveDown = (index) => {
    if (index === pages.length - 1) return
    const newPages = [...pages]
    ;[newPages[index + 1], newPages[index]] = [newPages[index], newPages[index + 1]]
    setPages(newPages)
  }

  const removePage = (index) => {
    setPages(pages.filter((_, i) => i !== index))
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setPages((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const mergePDFs = async () => {
    if (pages.length === 0) return

    const mergedPdf = await PDFDocument.create()
    const loadedPdfs = {}

    for (const page of pages) {
      if (!loadedPdfs[page.fileId]) {
        loadedPdfs[page.fileId] = await PDFDocument.load(pdfFiles[page.fileId].bytes)
      }
      const srcPdf = loadedPdfs[page.fileId]
      const [copiedPage] = await mergedPdf.copyPages(srcPdf, [page.pageIndex])
      mergedPdf.addPage(copiedPage)
    }

    const mergedBytes = await mergedPdf.save()
    const blob = new Blob([mergedBytes], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "merged.pdf"
    a.click()
  }

  const sensors = useSensors(useSensor(PointerSensor))

  return (
    <div style={{ padding: "40px", maxWidth: "860px", margin: "0 auto" }}>
      <h1>PDFçµåãã¼ã«ï½ç¡æã»ã¢ããã­ã¼ãä¸è¦</h1>
      <p style={{ color: "#555", marginBottom: "24px" }}>
        è¤æ°ã®PDFããã¼ã¸åä½ã§ä¸¦ã¹æ¿ãã¦çµåã§ãã¾ãããã¡ã¤ã«ã¯ç«¯æ«ããåºã¾ããã
      </p>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          addFiles(e.dataTransfer.files)
        }}
        style={{
          border: "2px dashed #c41e1e",
          padding: "40px",
          marginBottom: "20px",
          cursor: "pointer",
          borderRadius: "8px",
          textAlign: "center",
          background: "#fff8f8",
        }}
      >
        <input
          type="file"
          multiple
          accept=".pdf"
          onChange={(e) => addFiles(e.target.files)}
        />
        <br /><br />
        ð ããã«PDFããã©ãã°ï¼ãã­ãã
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={pages.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {pages.map((page, index) => (
            <SortableItem
              key={page.id}
              page={page}
              pdfFiles={pdfFiles}
              index={index}
              moveUp={moveUp}
              moveDown={moveDown}
              removePage={removePage}
            />
          ))}
        </SortableContext>
      </DndContext>

      {pages.length > 0 && (
        <button
          onClick={mergePDFs}
          style={{
            padding: "12px 28px",
            fontSize: "16px",
            cursor: "pointer",
            background: "#c41e1e",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            marginTop: "16px",
          }}
        >
          PDFãçµåãã¦ãã¦ã³ã­ã¼ã
        </button>
      )}

      <SeoContent />

      <footer style={{ textAlign: 'center', padding: '32px 0 16px', fontSize: '13px', color: '#999', borderTop: '1px solid #eee', marginTop: '8px' }}>
        <a href="/privacy.html" style={{ color: '#999' }}>プライバシーポリシー</a>
        {' | '}
        <a href="https://github.com/shinogin/pdf-app" target="_blank" rel="noopener" style={{ color: '#999' }}>GitHub</a>
      </footer>
    </div>
  )
}

export default App
