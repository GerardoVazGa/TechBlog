export const renderAboutPage = (req, res) => {
    res.render('about.ejs', { current: 'about' })
}

export const renderContactPage = (req, res) => {
    res.render('contact.ejs', { current: 'contact' })
}
