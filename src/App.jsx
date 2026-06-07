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
        ⠿
      </div>
      {page.thumbnail && (
        <img
          src={page.thumbnail}
          style={{ height: "80px", border: "1px solid #ccc", flexShrink: 0 }}
          alt=""
        />
      )}
      <span style={{ flex: 1 }}>
        {pdfFiles[page.fileId]?.name} - {page.pageIndex + 1}ページ
      </span>
      <button onClick={() => moveUp(index)}>↑</button>
      <button onClick={() => moveDown(index)} style={{ marginLeft: "4px" }}>↓</button>
      <button onClick={() => removePage(index)} style={{ marginLeft: "4px" }}>削除</button>
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
    <div style={{ padding: "40px" }}>
      <h1>PDF結合アプリ</h1>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          addFiles(e.dataTransfer.files)
        }}
        style={{
          border: "2px dashed gray",
          padding: "40px",
          marginBottom: "20px",
          cursor: "pointer",
        }}
      >
        <input
          type="file"
          multiple
          accept=".pdf"
          onChange={(e) => addFiles(e.target.files)}
        />
        <br />
        <br />
        ここにPDFをドラッグ
      </div>

      <br />

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

      <br />

      <button
        onClick={mergePDFs}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        PDFを結合
      </button>
    </div>
  )
}

export default App
