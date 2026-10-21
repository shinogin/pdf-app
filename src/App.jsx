import { useState, useRef } from "react"
import { PDFDocument, degrees } from "pdf-lib"
import * as pdfjsLib from "pdfjs-dist"
import JSZip from "jszip"
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

const btnStyle = {
  padding: "4px 10px",
  border: "1px solid #ddd",
  borderRadius: "4px",
  background: "#f9f9f9",
  color: "#333",
  cursor: "pointer",
  fontSize: "14px",
}

function SortableItem({ page, pdfFiles, index, moveUp, moveDown, removePage, rotatePage }) {
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
        padding: "12px 16px",
        marginBottom: "8px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: isDragging ? "#f5f5f5" : "#fff",
        boxShadow: isDragging ? "0 4px 12px rgba(0,0,0,0.15)" : "0 1px 3px rgba(0,0,0,0.06)",
        userSelect: "none",
      }}
    >
      <div
        {...attributes}
        {...listeners}
        style={{ cursor: "grab", color: "#ccc", fontSize: "20px" }}
      >
        ⠿
      </div>
      {page.thumbnail && (
        <img
          src={page.thumbnail}
          style={{
            height: "72px",
            border: "1px solid #eee",
            borderRadius: "4px",
            flexShrink: 0,
            transform: `rotate(${page.rotation}deg)`,
            transition: "transform 0.2s",
          }}
          alt=""
        />
      )}
      <span style={{ flex: 1, fontSize: "14px", color: "#333" }}>
        {pdfFiles[page.fileId]?.name} — {page.pageIndex + 1}ページ
      </span>
      <div style={{ display: "flex", gap: "4px" }}>
        <button onClick={() => rotatePage(index)} style={btnStyle} title="回転">↻</button>
        <button onClick={() => moveUp(index)} style={btnStyle}>↑</button>
        <button onClick={() => moveDown(index)} style={btnStyle}>↓</button>
        <button onClick={() => removePage(index)} style={{ ...btnStyle, color: "#e55" }}>✕</button>
      </div>
    </div>
  )
}

const faqs = [
  { q: "完全無料で使えますか？", a: "はい、完全無料です。会員登録やクレジットカードも不要で、すべての機能を制限なくお使いいただけます。" },
  { q: "ファイルはサーバーにアップロードされますか？", a: "されません。このツールはすべてブラウザ内（お使いの端末上）で動作します。PDFファイルが外部サーバーに送信されることは一切ありませんので、機密文書も安心してお使いいただけます。" },
  { q: "何ページまで・何ファイルまで結合できますか？", a: "ページ数・ファイル数に制限はありません。ただし、非常に大きなファイルの場合はブラウザのメモリ状況によって処理に時間がかかる場合があります。" },
  { q: "対応しているブラウザは？", a: "Google Chrome、Mozilla Firefox、Microsoft Edge、Safari（最新版）に対応しています。スマートフォン・タブレットのブラウザでもご利用いただけます。" },
  { q: "ページの順番は自由に変えられますか？", a: "はい。ドラッグ＆ドロップで自由に並べ替えができます。↑↓ボタンでの移動、↻ボタンでのページ回転、ページ単位の削除にも対応しています。" },
  { q: "PDFを画像（PNG・JPEG）に変換できますか？", a: "できます。出力形式で「画像に変換」を選ぶと、各ページをPNGまたはJPEG画像として保存できます。解像度は×1〜×3から選べ、並べ替えや回転もそのまま反映されます。" },
  { q: "複数ページを画像にするとどうなりますか？", a: "2ページ以上ある場合は、各ページの画像を1つのZIPファイルにまとめてダウンロードします。ファイル名は指定した名前に連番（_001、_002…）が付きます。" },
]

function SeoContent() {
  const [openFaq, setOpenFaq] = useState(null)
  const s = {
    wrap: { marginTop: "16px", lineHeight: "1.7", color: "var(--text)", textAlign: "left" },
    section: { marginTop: "48px", paddingTop: "32px", borderTop: "1px solid var(--border)" },
    h2: { fontSize: "20px", fontWeight: "700", margin: "0 0 16px", color: "var(--text-h)" },
    features: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" },
    card: { border: "1px solid var(--border)", borderRadius: "8px", padding: "16px" },
    cardTitle: { fontWeight: "700", fontSize: "15px", marginBottom: "8px", color: "#2563eb" },
    steps: { listStyle: "none", padding: 0, margin: 0 },
    step: { display: "flex", gap: "16px", marginBottom: "16px", alignItems: "flex-start" },
    stepNum: { background: "#2563eb", color: "#fff", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", flexShrink: 0, fontSize: "14px" },
    faqItem: { borderBottom: "1px solid var(--border)" },
    faqQ: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "14px 0", cursor: "pointer", fontWeight: "600", fontSize: "15px", color: "var(--text-h)" },
    faqA: { margin: 0, padding: "0 0 14px", fontSize: "14px" },
  }
  const features = [
    ["🔒 ファイルは端末から出ない", "すべての処理はブラウザ内で完結。PDFが外部サーバーに送信されることは一切ありません。"],
    ["🆓 完全無料・登録不要", "会員登録やインストールは不要。ブラウザで開くだけでPDFの結合が無料でできます。"],
    ["📄 ページ単位で並べ替え", "複数のPDFをページ単位で読み込み、サムネイルを見ながら順序を変えたり回転したりして結合できます。"],
    ["🖼️ 画像にも変換できる", "PDFの各ページをPNG・JPEG画像に変換。複数ページはZIPでまとめてダウンロードできます。"],
  ]
  const steps = [
    ["PDFを追加", "上のエリアにPDFファイルをドラッグ＆ドロップするか、「ファイルを選択」から複数のPDFを選びます。"],
    ["ページを並べ替え", "読み込んだPDFがページ一覧として表示されます。サムネイルを確認しながら、ドラッグまたは↑↓ボタンで順番を整えます。↻で回転、✕で不要なページを除外できます。"],
    ["結合してダウンロード", "ファイル名と出力形式（PDF結合／画像に変換）を選び、ボタンを押すと並べ替えた順にダウンロードされます。"],
  ]
  return (
    <div style={s.wrap}>
      <section style={s.section} aria-labelledby="features-heading">
        <h2 id="features-heading" style={s.h2}>このツールの特徴</h2>
        <div style={s.features}>
          {features.map(([title, desc]) => (
            <div key={title} style={s.card}>
              <div style={s.cardTitle}>{title}</div>
              <p style={{ margin: 0, fontSize: "14px" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={s.section} aria-labelledby="howto-heading">
        <h2 id="howto-heading" style={s.h2}>使い方（3ステップ）</h2>
        <ol style={s.steps}>
          {steps.map(([title, desc], i) => (
            <li key={title} style={s.step}>
              <span style={s.stepNum}>{i + 1}</span>
              <div><strong style={{ color: "var(--text-h)" }}>{title}</strong><br /><span style={{ fontSize: "14px" }}>{desc}</span></div>
            </li>
          ))}
        </ol>
      </section>

      <section style={s.section} aria-labelledby="faq-heading">
        <h2 id="faq-heading" style={s.h2}>よくある質問</h2>
        <dl style={{ margin: 0 }}>
          {faqs.map((faq, i) => (
            <div key={faq.q} style={s.faqItem}>
              <dt
                style={s.faqQ}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenFaq(openFaq === i ? null : i) } }}
                aria-expanded={openFaq === i}
              >
                <span>Q. {faq.q}</span>
                <span style={{ fontSize: "18px", color: "#2563eb" }}>{openFaq === i ? "−" : "+"}</span>
              </dt>
              <dd style={{ ...s.faqA, display: openFaq === i ? "block" : "none" }}>A. {faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section style={{ ...s.section, marginBottom: "32px" }} aria-labelledby="about-heading">
        <h2 id="about-heading" style={s.h2}>PDF結合ツールについて</h2>
        <p style={{ fontSize: "14px", margin: 0 }}>
          このPDF結合ツールは、複数のPDFファイルを無料でオンライン結合（マージ）できるWebアプリです。
          pdf-libおよびpdfjs-distを使用したクライアントサイド処理により、ファイルは一切サーバーに送信されません。
          ページ単位での並べ替え・回転・削除に対応しており、サムネイルで内容を確認しながら編集できます。
          PDFの各ページをPNG・JPEG画像に変換して保存することもできます。
          契約書・請求書・報告書など、機密性の高いPDFの結合にも安心してご利用いただけます。
        </p>
      </section>
    </div>
  )
}

function App() {
  const [pdfFiles, setPdfFiles] = useState({})
  const [pages, setPages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [outputName, setOutputName] = useState("merged")
  const [outputFormat, setOutputFormat] = useState("pdf")
  const [imageFormat, setImageFormat] = useState("png")
  const [imageScale, setImageScale] = useState(2)
  const nextId = useRef(0)

  const genId = () => String(nextId.current++)

  const addFiles = async (fileList) => {
    setIsLoading(true)
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

        newPages.push({ id: genId(), fileId, pageIndex: i, thumbnail, rotation: 0 })
      }
    }

    setPdfFiles((prev) => ({ ...prev, ...newPdfFiles }))
    setPages((prev) => [...prev, ...newPages])
    setIsLoading(false)
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

  const rotatePage = (index) => {
    const newPages = [...pages]
    newPages[index] = { ...newPages[index], rotation: (newPages[index].rotation + 90) % 360 }
    setPages(newPages)
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
      if (page.rotation !== 0) {
        const existing = copiedPage.getRotation().angle
        copiedPage.setRotation(degrees((existing + page.rotation) % 360))
      }
      mergedPdf.addPage(copiedPage)
    }

    const mergedBytes = await mergedPdf.save()
    const blob = new Blob([mergedBytes], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${outputName || "merged"}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportAsImages = async () => {
    if (pages.length === 0) return
    setIsLoading(true)

    try {
      const mimeType = imageFormat === "png" ? "image/png" : "image/jpeg"
      const ext = imageFormat === "png" ? "png" : "jpg"
      const loadedDocs = {}
      const images = []

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i]
        if (!loadedDocs[page.fileId]) {
          loadedDocs[page.fileId] = await pdfjsLib.getDocument({
            data: new Uint8Array(pdfFiles[page.fileId].bytes),
          }).promise
        }
        const pdfjsPage = await loadedDocs[page.fileId].getPage(page.pageIndex + 1)
        const viewport = pdfjsPage.getViewport({ scale: imageScale, rotation: page.rotation })
        const canvas = document.createElement("canvas")
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext("2d")
        await pdfjsPage.render({ canvasContext: ctx, viewport }).promise

        const blob = await new Promise((r) =>
          canvas.toBlob(r, mimeType, imageFormat === "jpg" ? 0.92 : undefined)
        )
        images.push({ blob, name: `${outputName || "page"}_${String(i + 1).padStart(3, "0")}.${ext}` })
      }

      if (images.length === 1) {
        const url = URL.createObjectURL(images[0].blob)
        const a = document.createElement("a")
        a.href = url
        a.download = images[0].name
        a.click()
        URL.revokeObjectURL(url)
      } else {
        const zip = new JSZip()
        for (const img of images) zip.file(img.name, img.blob)
        const zipBlob = await zip.generateAsync({ type: "blob" })
        const url = URL.createObjectURL(zipBlob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${outputName || "pages"}.zip`
        a.click()
        URL.revokeObjectURL(url)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = () => {
    if (outputFormat === "pdf") mergePDFs()
    else exportAsImages()
  }

  const sensors = useSensors(useSensor(PointerSensor))

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "40px 20px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>PDF結合アプリ</h1>
      <p style={{ color: "#666", fontSize: "14px", marginBottom: "24px" }}>
        PDFをページ単位で並べ替えて結合できます。アップロード不要・無料。
      </p>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          addFiles(e.dataTransfer.files)
        }}
        style={{
          border: "2px dashed #bbb",
          borderRadius: "12px",
          padding: "40px",
          marginBottom: "24px",
          textAlign: "center",
          background: "#fafafa",
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
        <p style={{ marginTop: "12px", color: "#888", fontSize: "14px" }}>ここにPDFをドラッグ、またはファイルを選択</p>
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", padding: "20px", color: "#888", fontSize: "14px" }}>
          処理中...
        </div>
      )}

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
              rotatePage={rotatePage}
            />
          ))}
        </SortableContext>
      </DndContext>

      {pages.length > 0 && (
        <div style={{ marginTop: "24px", padding: "20px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <label style={{ fontSize: "14px", color: "#555", whiteSpace: "nowrap" }}>ファイル名:</label>
            <input
              type="text"
              value={outputName}
              onChange={(e) => setOutputName(e.target.value)}
              placeholder="merged"
              style={{ flex: 1, minWidth: "120px", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
            />
          </div>
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <label style={{ fontSize: "14px", color: "#555", whiteSpace: "nowrap" }}>出力形式:</label>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
            >
              <option value="pdf">PDF（結合）</option>
              <option value="image">画像に変換</option>
            </select>
            {outputFormat === "image" && (
              <>
                <select
                  value={imageFormat}
                  onChange={(e) => setImageFormat(e.target.value)}
                  style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
                >
                  <option value="png">PNG</option>
                  <option value="jpg">JPEG</option>
                </select>
                <select
                  value={imageScale}
                  onChange={(e) => setImageScale(Number(e.target.value))}
                  style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
                >
                  <option value={1}>低解像度（×1）</option>
                  <option value={2}>標準（×2）</option>
                  <option value={3}>高解像度（×3）</option>
                </select>
              </>
            )}
          </div>
          {outputFormat === "image" && pages.length > 1 && (
            <p style={{ fontSize: "12px", color: "#888", marginBottom: "12px" }}>
              ※ 複数ページの場合、ZIPファイルとしてダウンロードされます
            </p>
          )}
          <button
            onClick={handleExport}
            disabled={isLoading}
            style={{
              padding: "12px 32px",
              fontSize: "16px",
              fontWeight: "bold",
              background: isLoading ? "#94a3b8" : "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? "処理中..." : outputFormat === "pdf" ? "PDFを結合してダウンロード" : "画像に変換してダウンロード"}
          </button>
        </div>
      )}

      <SeoContent />

      <footer style={{ textAlign: "center", padding: "24px 0 16px", fontSize: "13px", borderTop: "1px solid var(--border)" }}>
        <a href="/privacy.html" style={{ color: "inherit" }}>プライバシーポリシー</a>
        {" | "}
        <a href="https://github.com/shinogin/pdf-app" target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>GitHub</a>
      </footer>
    </div>
  )
}

export default App
