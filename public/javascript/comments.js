class CommentsSection {
    constructor() {
        this.commentsContainer = document.getElementById('comments')
        this.commentsForm = document.getElementById('comments-form')
        this.commentsBox = document.getElementById('comments-box')
        this.commentsCounter = document.getElementById('comment-count') 
        this.replyFormContanier = null
        this.state ={
            comments: []
        }
    }

    init() {
        if(!this.commentsContainer || !this.commentsForm) return

        this.commentsForm.addEventListener("submit", (e) => this.handleSubmit(e))

        this.getComments()

        this.commentsBox.addEventListener('click', (e) => this.handleActionButtons(e))
    }

    handleSubmit(e) {
        e.preventDefault()

        const formData = new FormData(this.commentsForm)

        const commentData = {
            postId: this.commentsContainer.dataset.postId,
            authorName: formData.get('author_name').trim(),
            content: formData.get('content').trim()
        }

        this.submitComment(commentData)
    }

    async submitComment(commentData) {
        try {
            const response = await fetch(`/api/post/${commentData.postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(commentData)
            })

            if(!response.ok){
                throw new Error('Error submitting comment')
                return
            }

            const newComment = await response.json()
            this.updateStateWithNewComment(newComment)
            this.addCommentToDOM(newComment)
            this.commentsForm.reset()
            this.closeReplyForm()
        } catch (error) {
            console.error('Error submitting comment:', error)
        }
    }
    
    async getComments(){
        const postId = this.commentsContainer.dataset.postId

        try {
            const response = await fetch(`/api/post/${postId}/comments`)
            if(!response.ok){
                throw new Error('Error fetching comments')
                return
            }

            const comments = await response.json()
            this.state.comments = comments
            this.renderComments(this.state.comments)
        } catch(error) {
            console.error('Error fetching comments: ', error)
        } 
    }

    renderComments(comments){
        this.commentsBox.innerHTML = ""

        if(!comments ||comments.length === 0){
            this.renderEmptyState()
            this.commentsCounter.textContent = 0
            return
        }

        const fragment = document.createDocumentFragment()
        comments.forEach(comment => {
            const commentElement = this.createCommentNode(comment)
            fragment.appendChild(commentElement)
        })

        this.commentsCounter.textContent = this.countComments(comments)
        this.commentsBox.appendChild(fragment)
    }

    getInitials(name) {
        const names = name.split(' ')
        if(names.length === 0) return "?"

        return names.map(name => name[0]).join('').toUpperCase().slice(0, 2)
    }

    createButton(icon, text, action = null) {
        const btn = document.createElement('button')
        btn.classList.add('comment-action-btn')
        btn.textContent = `${icon} ${text}`
        btn.dataset.action = action
        return btn
    }

    createCommentNode(comment, isReply = false) {
        const commentItem = document.createElement('div')
        commentItem.classList.add(isReply ? 'reply-item': 'comment-item')
        commentItem.dataset.commentId = comment.id

        // Avatar
        const avatar = document.createElement('div')
        avatar.classList.add(isReply ? 'reply-avatar': 'comment-avatar')
        avatar.textContent = this.getInitials(comment.author_name)

        // Content
        const content = document.createElement('div')
        content.classList.add('comment-content')

        // Header
        const header = document.createElement('div')
        header.classList.add('comment-header')

        const author = document.createElement('span')
        author.classList.add('comment-author')
        author.textContent = comment.author_name

        const date = document.createElement('span')
        date.classList.add('comment-date')
        if(comment.deleted_at){
            date.textContent = `${comment.created_at} - Eliminado`
        }else {
            date.textContent = comment.created_at
        }

        header.append(author, date)

        // Text
        const text = document.createElement('p')
        text.classList.add('comment-text')
        if(comment.deleted_at){
            text.textContent= "[Comentario Eliminado]"
            text.classList.add('deleted-comment')
        }else{
            text.textContent = comment.content
        }

        // Actions
        const actions = document.createElement('div')
        actions.classList.add('comment-actions')

        if(!comment.deleted_at){
            const likes = comment.likes > 0 ? comment.likes : '0'
            const likeBtn = this.createButton('👍', likes, 'like')
            likeBtn.dataset.countLikes = comment.likes

            if(comment.is_liked){
                likeBtn.classList.add('liked')
            }

            const replyBtn = this.createButton('💬', 'Responder', 'reply')
            const reportBtn = this.createButton('🚩', 'Reportar', 'report')

            actions.append(likeBtn, replyBtn, reportBtn)
        }

        // Append main content
        content.append(header, text, actions)

        // Replies
        if(comment.replies && comment.replies.length > 0) {
            const repliesContainer = document.createElement('div')
            repliesContainer.classList.add('comments-replies')
            comment.replies.forEach(reply => {
                const replyNode = this.createCommentNode(reply, true)
                repliesContainer.appendChild(replyNode)
            })

            content.appendChild(repliesContainer)
        }


        commentItem.append(avatar, content)

        return commentItem
    }

    showReplyForm(commentId, commentItem) {
        this.closeReplyForm()

        this.replyFormContanier = document.createElement('div')
        this.replyFormContanier.classList.add('reply-form-wrapper', 'active')

        const replyTitle = document.createElement('h4')
        replyTitle.textContent = "Responder a este comentario"

        const replyForm = document.createElement('form')
        replyForm.classList.add('reply-form')
        replyForm.dataset.parentCommentId = commentId

        const replyFormGroup = document.createElement('div')
        replyFormGroup.classList.add('reply-form-group')

        const replyAuthorLabel = document.createElement('label')
        replyAuthorLabel.textContent = 'Tu Nombre'

        const replyAuthorInput = document.createElement('input')
        replyAuthorInput.type = 'text'
        replyAuthorInput.name = 'author_name'
        replyAuthorInput.required = true

        replyFormGroup.append(replyAuthorLabel, replyAuthorInput)

        const replyFormGroupTextarea = document.createElement('div')
        replyFormGroupTextarea.classList.add('reply-form-group')

        const replyTextLabel = document.createElement('label')
        replyTextLabel.textContent = 'Tu Comentario'

        const replyTextInput = document.createElement('textarea')
        replyTextInput.name = 'content'
        replyTextInput.required = true

        replyFormGroupTextarea.append(replyTextLabel, replyTextInput)

        const replyFormActions = document.createElement('div')
        replyFormActions.classList.add('reply-form-actions')

        const replySubmit = document.createElement('button')
        replySubmit.type = 'submit'
        replySubmit.textContent = 'Responder'
        replySubmit.classList.add('reply-form-submit')

        const replyCancel = document.createElement('button')
        replyCancel.type = 'button'
        replyCancel.textContent = 'Cancelar'
        replyCancel.classList.add('reply-form-cancel')

        replyFormActions.append(replySubmit, replyCancel)

        replyForm.append(replyFormGroup, replyFormGroupTextarea, replyFormActions)

        this.replyFormContanier.append(replyTitle, replyForm)

        const commentContent = commentItem.querySelector('.comment-content')

        commentContent.appendChild(this.replyFormContanier)

        const rect = this.replyFormContanier.getBoundingClientRect()
        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight

        if(!isVisible) {
            this.replyFormContanier.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            })
        }

        replyForm.addEventListener('submit', (e) => this.handleReplySubmit(e))

        replyCancel.addEventListener('click', (e) => {
            e.preventDefault()
            this.closeReplyForm()
        })

    }

    handleReplySubmit(e){
        e.preventDefault()

        const formReply = e.target.closest('.reply-form')
        const formData = new FormData(formReply)

        const replyData = {
            postId: this.commentsContainer.dataset.postId,
            authorName: formData.get('author_name').trim(),
            content: formData.get('content').trim(),
            parentCommentId: formReply.dataset.parentCommentId
        }

        this.submitComment(replyData)
    }

    addCommentToDOM(newComment) {
        const emptyState = this.commentsBox.querySelector('.empty-comments-state')
        if(emptyState) {
            emptyState.remove()
        }
        
        if(!newComment.parent_comment_id){
            this.commentsBox.prepend(this.createCommentNode(newComment, false))
        } else {
            const parentComment = this.commentsBox.querySelector(`[data-comment-id="${newComment.parent_comment_id}"]`)

            if(parentComment) {
                let repliesContainer = parentComment.querySelector('.comments-replies')

                if(!repliesContainer){
                    repliesContainer = document.createElement('div')
                    repliesContainer.classList.add('comments-replies')
                    parentComment.querySelector('.comment-content').appendChild(repliesContainer)
                }

                repliesContainer.appendChild(this.createCommentNode(newComment, true))
            }
            
        }
        this.commentsCounter.textContent = this.countComments(this.state.comments)

    }

    updateStateWithNewComment(newComment){
        if(!newComment.parent_comment_id){
            this.state.comments.unshift(newComment)
        }

        const parentComment = this.findCommentById(this.state.comments, newComment.parent_comment_id)

        if(parentComment){
            parentComment.replies = parentComment.replies || []
            parentComment.replies.push(newComment)
        }
        
    }

    findCommentById(comments, commentParentId){
        for(let comment of comments){
            if(comment.id === commentParentId) return comment

            if(comment.replies && comment.replies.length > 0){
                const found = this.findCommentById(comment.replies, commentParentId)
                if(found) return found
            }

        }
    }

    countComments(comments) {
        let count = 0
        comments.forEach(comment => {
            count++
            if(comment.replies && comment.replies.length > 0) {
                count += this.countComments(comment.replies)
            }
        })

        return count
    }

    closeReplyForm(){
        if(this.replyFormContanier){
            this.replyFormContanier.remove()
            this.replyFormContanier = null
        }
    }

    handleActionButtons(e){
        const btn = e.target.closest('.comment-action-btn')

        if(!btn) return

        const action = btn.dataset.action

        const commentItem = btn.closest('.comment-item, .reply-item')
        const commentId = commentItem.dataset.commentId

        switch(action){
            case 'reply':
                this.showReplyForm(commentId, commentItem)
                break
            case 'like': 
                this.toggleCommentLike(commentId, btn)
                break
            case 'delete': 
                this.softDeleteComment(commentId, commentItem)
                break
        }

    }

    renderEmptyState() {
        const emptyState = document.createElement('div')
        emptyState.classList.add('empty-comments-state')

        emptyState.innerHTML = `
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <h4>Sé el primero en comentar</h4>
            <p>Tu opinión es valiosa. Comparte tus pensamientos sobre este artículo.</p>
        `

        this.commentsBox.appendChild(emptyState)
    }

    async softDeleteComment(commentId, commentItem){
        try {
            const response = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE'
            })

            if(!response.ok){
                throw new Error('Error deleting comment')
                return
            }

            this.updateStateSoftDelete(commentId)
            this.softDeleteToDOM(commentItem)
        } catch (error) {
            console.error('Error deleting comment:', error)
        }

    }

    updateStateSoftDelete(commentParentId){
        const comment = this.findCommentById(this.state.comments, commentParentId)

        if(comment){
            comment.deleted_at = new Date().toISOString()
        }
    }

    softDeleteToDOM(commentItem){
        commentItem.classList.add('comment-deleted')
        const commentDate = commentItem.querySelector('.comment-date')
        commentDate.textContent = 'Hace poco - Comentario Eliminado'
        const commentText = commentItem.querySelector('.comment-text')
        commentText.textContent = 'El comentario ha sido eliminado'

        const commentActions = commentItem.querySelector('.comment-actions')
        commentActions.remove()

        commentText.classList.add('deleted-comment')

    }

    async toggleCommentLike(commentId, btn){
        if(btn.disabled) return

        btn.disabled = true

        const prevLiked = btn.classList.contains('liked')
        const prevLikes = parseInt(btn.textContent.replace('👍 ', ''))  || 0
        
        const newLiked = !prevLiked
        const newLikes = newLiked ? prevLikes + 1 : prevLikes - 1 

        this.updateNewLikeToDOM(btn, newLiked, newLikes)
        
        try {
            const response = await fetch(`/api/comments/${commentId}/like`, {
                method: 'POST'
            })

            if(!response.ok){
                throw new Error('Error liking comment')
                return
            }

            const comment = await response.json()
            
            this.updateStateNewLike(commentId, comment.is_liked, comment.likes)
            this.updateNewLikeToDOM(btn, comment.is_liked, comment.likes)


        } catch (error) {
            this.updateNewLikeToDOM(btn, prevLiked, prevLikes)
        } finally {
            btn.disabled = false
        }
    }

    updateStateNewLike(commentParentId, liked, likes){
        const comment = this.findCommentById(this.state.comments, commentParentId)

        if(!comment) return

        comment.is_liked = liked
        comment.likes = likes
    }

    updateNewLikeToDOM(btn, liked, likes){
        const likeBtn = btn
        likeBtn.textContent= `👍 ${likes}`

        if(liked){
            btn.classList.add('liked')
        } else {
            btn.classList.remove('liked')
        }
    }

}

document.addEventListener("DOMContentLoaded", () => {
    const commentsSection = new CommentsSection()
    commentsSection.init()
})
