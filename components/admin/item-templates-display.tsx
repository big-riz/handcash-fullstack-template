"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Sparkles, FileText, Copy, Archive, ArchiveRestore } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ItemTemplateMintDialog } from "@/components/admin/item-template-mint-dialog"
import { ItemTemplateCreateDialog } from "@/components/admin/item-template-create-dialog"
import { MediaPreview } from "@/components/admin/media-preview"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2, Pencil } from "lucide-react"
import { toast } from "sonner"
import { getRarityClasses } from "@/lib/rarity-colors"

interface ItemTemplate {
  id: string
  name: string
  description?: string
  imageUrl?: string
  multimediaUrl?: string
  collectionId: string
  attributes?: Array<{
    name: string
    value: string | number
    displayType?: "string" | "number"
  }>
  rarity?: string
  color?: string
  pool?: string
  supplyLimit?: number
  isArchived?: boolean
}

export function ItemTemplatesDisplay() {
  const [templates, setTemplates] = useState<ItemTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<ItemTemplate | null>(null)
  const [isMintOpen, setIsMintOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<ItemTemplate | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [deletingTemplate, setDeletingTemplate] = useState<ItemTemplate | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const copyTemplateId = async (templateId: string) => {
    await navigator.clipboard.writeText(templateId)
    setCopiedId(templateId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getMintTotalSupply = (poolName: string) => {
    return templates
      .filter((t) => (t.pool || "default") === poolName)
      .reduce((sum, t) => sum + (t.supplyLimit || 0), 0)
  }

  const fetchTemplates = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/item-templates", {
        credentials: "include",
      })

      if (!response.ok) {
        if (response.status === 401) {
          setIsLoading(false)
          return
        }
        throw new Error("Failed to fetch templates")
      }

      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (err: any) {
      console.error("[v0] Item templates fetch error:", err)
      setError(err.message || "Failed to load item templates")
    } finally {
      setIsLoading(false)
    }
  }

  const handleMint = (template: ItemTemplate) => {
    setSelectedTemplate(template)
    setIsMintOpen(true)
  }

  const handleMintSuccess = () => {
    setIsMintOpen(false)
    setSelectedTemplate(null)
    fetchTemplates()
  }

  const handleEdit = (template: ItemTemplate, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    setEditingTemplate(template)
    setIsEditOpen(true)
  }

  const handleEditSuccess = () => {
    setIsEditOpen(false)
    setEditingTemplate(null)
    fetchTemplates()
  }

  const handleDeleteClick = (template: ItemTemplate, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    setDeletingTemplate(template)
    setIsDeleteDialogOpen(true)
  }

  const handleArchiveConfirm = async () => {
    if (!deletingTemplate) return

    setIsDeleting(true)
    try {
      const action = deletingTemplate.isArchived ? "unarchive" : "archive"
      const response = await fetch(`/api/admin/item-templates?id=${deletingTemplate.id}&action=${action}`, {
        method: "PATCH",
        credentials: "include",
      })

      if (!response.ok) {
        const data = await response.json()
        console.error("Archive API error response:", data)
        throw new Error(data.error || data.details || "Failed to update template")
      }

      toast.success(deletingTemplate.isArchived ? "Template unarchived successfully" : "Template archived successfully")
      setIsDeleteDialogOpen(false)
      setDeletingTemplate(null)
      fetchTemplates()
    } catch (err: any) {
      console.error("Archive template error:", err)
      toast.error(err.message || "Failed to update template")
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  return (
    <>
      <Card className="p-6 rounded-3xl border-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Item Templates</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchTemplates} disabled={isLoading} className="rounded-full">
              <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {!isLoading && !error && templates.length > 0 && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(new Set(templates.map(t => t.pool || "default"))).map(poolName => (
              <div key={poolName} className="p-4 rounded-2xl bg-muted/50 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Mint: {poolName}
                  </h4>
                  <Badge variant="outline" className="rounded-full bg-background text-xs">
                    {templates.filter(t => (t.pool || "default") === poolName).length} Varieties
                  </Badge>
                </div>
                <div className="space-y-1 mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Total Potential Supply</span>
                    <span className="font-mono font-bold text-foreground">
                      {getMintTotalSupply(poolName) || "Unlimited"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Alert variant="destructive" className="rounded-2xl">
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">No item templates yet</p>
            <p className="text-sm text-muted-foreground mt-2">Create templates to quickly mint items to multiple users</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card hover:shadow-lg transition-all cursor-pointer"
                onClick={() => handleEdit(template)}
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  <MediaPreview
                    imageUrl={template.imageUrl}
                    multimediaUrl={template.multimediaUrl}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-lg truncate flex-1">{template.name}</h4>
                    <div className="flex gap-1 ml-2 shrink-0">
                      {template.isArchived && (
                        <Badge variant="secondary" className="rounded-full text-xs bg-muted">
                          Archived
                        </Badge>
                      )}
                      {template.rarity && (
                        <Badge className={`rounded-full text-xs border ${getRarityClasses(template.rarity)}`}>
                          {template.rarity}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {template.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{template.description}</p>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs rounded-full font-mono flex-1">
                      ID: {template.id}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyTemplateId(template.id)
                      }}
                    >
                      <Copy className={`w-3 h-3 ${copiedId === template.id ? "text-green-500" : ""}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 shrink-0"
                      onClick={(e) => handleEdit(template, e)}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-5 w-5 p-0 shrink-0 ${template.isArchived ? "" : "text-destructive hover:text-destructive"}`}
                      onClick={(e) => handleDeleteClick(template, e)}
                      title={template.isArchived ? "Unarchive template" : "Archive template"}
                    >
                      {template.isArchived ? (
                        <ArchiveRestore className="w-3 h-3" />
                      ) : (
                        <Archive className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline" className="text-xs rounded-full bg-primary/5 border-primary/20">
                      Pool: {template.pool || "default"}
                    </Badge>
                    <Badge variant="outline" className="text-xs rounded-full bg-orange-500/5 border-orange-500/20">
                      Supply: {template.supplyLimit || "∞"}
                    </Badge>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full rounded-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMint(template)
                    }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Mint
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {selectedTemplate && (
        <ItemTemplateMintDialog
          template={selectedTemplate}
          open={isMintOpen}
          onOpenChange={setIsMintOpen}
          onSuccess={handleMintSuccess}
        />
      )}

      <ItemTemplateCreateDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={handleEditSuccess}
        template={editingTemplate}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deletingTemplate?.isArchived ? "Unarchive" : "Archive"} Template
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deletingTemplate?.isArchived
                ? `Are you sure you want to unarchive "${deletingTemplate?.name}"? It will be available for minting again.`
                : `Are you sure you want to archive "${deletingTemplate?.name}"? It will be hidden from the minting pool but can be unarchived later.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveConfirm}
              disabled={isDeleting}
              className={deletingTemplate?.isArchived ? "" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {deletingTemplate?.isArchived ? "Unarchiving..." : "Archiving..."}
                </>
              ) : (
                deletingTemplate?.isArchived ? "Unarchive" : "Archive"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

