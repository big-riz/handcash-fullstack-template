import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Send, Loader2 } from "lucide-react"
import { UserProfile } from "@/lib/auth-context"
import { GameComment } from "../types"
import { formatRelativeTime } from "@/lib/date-utils"

interface CommentsSectionProps {
    user: UserProfile | null
    comments: GameComment[]
    replyingTo: { id: number, handle: string } | null
    setReplyingTo: (val: { id: number, handle: string } | null) => void
    newComment: string
    setNewComment: (val: string) => void
    postComment: (parentId?: number) => void
    isPostingComment: boolean
}

export function CommentsSection({
    user,
    comments,
    replyingTo,
    setReplyingTo,
    newComment,
    setNewComment,
    postComment,
    isPostingComment
}: CommentsSectionProps) {
    return (
        <div className="max-w-6xl mx-auto px-4 pb-20">
            <div className="bg-card/40 backdrop-blur-xl border-4 border-white/5 rounded-[3rem] p-8 md:p-12 shadow-2xl">
                <div className="flex items-center gap-4 mb-8">
                    <MessageSquare className="w-8 h-8 text-primary" />
                    <h3 className="text-3xl md:text-4xl font-black italic uppercase text-white tracking-tighter">Hunter's Tavern</h3>
                </div>

                {user ? (
                    <div className="flex flex-col gap-4 mb-10">
                        {replyingTo && (
                            <div className="flex justify-between items-center bg-primary/10 border border-primary/20 p-3 rounded-xl animate-in slide-in-from-top-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-4 bg-primary rounded-full" />
                                    <span className="text-xs text-primary font-bold uppercase">Replying to @{replyingTo.handle}</span>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)} className="h-6 px-2 text-[10px] text-white/40 hover:text-white uppercase font-bold">Cancel</Button>
                            </div>
                        )}
                        <div className="flex gap-4 items-start">
                            <Avatar className="w-12 h-12 border-2 border-primary shadow-lg shrink-0">
                                <AvatarImage src={user.publicProfile.avatarUrl} />
                                <AvatarFallback className="bg-primary/20 text-primary font-bold">{user.publicProfile.handle.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-3">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder={replyingTo ? `Write your reply to @${replyingTo.handle}...` : "Leave a message for other hunters..."}
                                    className="w-full bg-black/40 border-2 border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 focus:border-primary/50 outline-none transition-all min-h-[100px] resize-none font-medium"
                                />
                                <div className="flex justify-end">
                                    <Button
                                        onClick={() => postComment(replyingTo?.id)}
                                        disabled={!newComment.trim() || isPostingComment}
                                        className="bg-primary text-black font-black uppercase px-8 rounded-xl h-12 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {isPostingComment ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> {replyingTo ? 'Post Reply' : 'Post Message'}</>}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-2xl p-8 text-center mb-10">
                        <p className="text-white/40 font-bold uppercase tracking-widest text-sm">Login with HandCash to join the conversation</p>
                    </div>
                )}

                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                    {comments.length > 0 ? (
                        comments
                            .filter(c => !c.parentId) // Only top-level comments first
                            .map((comment) => {
                                const replies = comments.filter(r => r.parentId === comment.id)
                                return (
                                    <div key={comment.id} className="space-y-4">
                                        {/* Top-level Comment */}
                                        <div className="flex gap-4 group animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <Avatar className="w-10 h-10 border border-white/10 shrink-0">
                                                <AvatarImage src={comment.avatarUrl} />
                                                <AvatarFallback className="bg-white/5 text-white/40">{comment.handle.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/5 group-hover:border-white/10 transition-all relative">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-primary font-black text-sm uppercase tracking-tighter">@{comment.handle}</span>
                                                    <span className="text-[10px] text-white/20 font-mono font-bold uppercase">{formatRelativeTime(comment.createdAt)}</span>
                                                </div>
                                                <p className="text-white/80 text-sm leading-relaxed font-medium mb-3">{comment.content}</p>
                                                <div className="flex justify-start">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setReplyingTo({ id: comment.id, handle: comment.handle })
                                                            // Scroll to textarea
                                                            document.querySelector('textarea')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                                        }}
                                                        className="h-7 px-3 text-[10px] text-white/40 hover:text-primary hover:bg-primary/5 uppercase font-black transition-all"
                                                    >
                                                        Reply
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Nested Replies */}
                                        {replies.length > 0 && (
                                            <div className="ml-10 space-y-4 border-l-2 border-white/5 pl-6">
                                                {replies.map((reply) => (
                                                    <div key={reply.id} className="flex gap-3 group animate-in fade-in slide-in-from-left-2 duration-500">
                                                        <Avatar className="w-8 h-8 border border-white/10 shrink-0">
                                                            <AvatarImage src={reply.avatarUrl} />
                                                            <AvatarFallback className="bg-white/5 text-white/40">{reply.handle.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 bg-white/[0.03] rounded-xl p-3 border border-white/5 group-hover:border-white/10 transition-all">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-primary font-black text-[11px] uppercase tracking-tighter">@{reply.handle}</span>
                                                                <span className="text-[9px] text-white/20 font-mono font-bold uppercase">{formatRelativeTime(reply.createdAt)}</span>
                                                            </div>
                                                            <p className="text-white/70 text-xs leading-relaxed font-medium">{reply.content}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                    ) : (
                        <div className="py-12 text-center text-white/10 italic font-black uppercase tracking-[0.3em]">The tavern is quiet... for now.</div>
                    )}
                </div>
            </div>
        </div>
    )
}
