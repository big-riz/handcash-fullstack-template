"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { GameComment } from "./types"
import { CommentsSection } from "./screens/CommentsSection"

export function GameComments() {
    const { user } = useAuth()
    const [gameComments, setGameComments] = useState<GameComment[]>([])
    const [replyingTo, setReplyingTo] = useState<{ id: number, handle: string } | null>(null)
    const [newComment, setNewComment] = useState("")
    const [isPostingComment, setIsPostingComment] = useState(false)

    const fetchComments = async () => {
        try {
            const res = await fetch('/api/comments')
            const data = await res.json()
            if (Array.isArray(data)) setGameComments(data)
        } catch (err) {
            console.error("Failed to fetch comments:", err)
        }
    }

    useEffect(() => {
        fetchComments()
    }, [])

    const postComment = async (parentId?: number) => {
        if (!newComment.trim() || !user || isPostingComment) return
        setIsPostingComment(true)
        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newComment.trim(),
                    parentId: parentId || null
                })
            })
            if (res.ok) {
                const posted = await res.json()
                setGameComments(prev => [posted, ...prev])
                setNewComment("")
                setReplyingTo(null)
            }
        } catch (err) {
            console.error("Failed to post comment:", err)
        } finally {
            setIsPostingComment(false)
        }
    }

    return (
        <CommentsSection
            user={user}
            comments={gameComments}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            newComment={newComment}
            setNewComment={setNewComment}
            postComment={postComment}
            isPostingComment={isPostingComment}
        />
    )
}
