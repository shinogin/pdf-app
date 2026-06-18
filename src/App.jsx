import { useState, useRef } from "react"
import { PDFDocument, degrees } from "pdf-lib"
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

const btnStyle = {
  padding: "4px 10px",
  border: "1px solid #ddd",
  borderRadius: "4px",
  background: "#f9f9f9",
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

function App() {
  const [pdfFiles, setPdfFiles] = useState({})
  const [pages, setPages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
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
    a.download = "merged.pdf"
    a.click()
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
        <div style={{ marginTop: "24px" }}>
          <button
            onClick={mergePDFs}
            style={{
              padding: "12px 32px",
              fontSize: "16px",
              fontWeight: "bold",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            PDFを結合してダウンロード
          </button>
        </div>
      )}
    </div>
  )
}

export default App
