import { Router } from "express"
import { getRecentPosts, getPost, getPostsByCategory, getAllPosts } from "../controllers/posts.controller.js"
import { renderAboutPage, renderContactPage } from "../controllers/views.controller.js"

const router = Router()

router.get('/', getRecentPosts)
router.get('/blog', getAllPosts)
router.get('/blog/page/:page', getAllPosts)
router.get('/about', renderAboutPage)
router.get('/contact', renderContactPage)
router.get('/blog/category/:category', getPostsByCategory)
router.get('/blog/category/:category/page/:page', getPostsByCategory)
router.get('/post/:slug',  getPost)

export default router