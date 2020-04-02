import os
import shutil
import glob
import re
mistune = __import__('mistune')
import subprocess

def recreateTitle(slug):
    title = re.sub('-', ' ', slug);
    title = title.title()
    return title

def createMainMenu(slug, title, parent, entries):
    print ("Creating main menu for " + title + "...")
    menu = "<ul><li><a href='./'>Home</a></li>"
    menuItems = dict()
    for entry in entries:
        entryMenu = entry[4].split('/', 2)
        entryMenu = entryMenu[1:-1]
        entryMenu = "".join(entryMenu)
        if entryMenu == entry[0]:
            menuItems[entry[1]] = entryMenu
    for key, value in menuItems.items():
        menu = menu + "<li><a href='" + value + ".html'>" + key + "</a></li>"
    menu = menu + '</ul>'
    print ("> Done!")
    return menu

def createSiblingsMenu(slug, title, parent, entries):
    print ("Creating siblings menu for " + parent + "...")
    siblings = ""
    for entry in entries:
        if entry[2] == slug:
            if(entry[0] != slug):
                siblings = siblings + "<li><a href='" + entry[0] + ".html'>" + entry[1] + "</a></li>"
    
    if siblings != "":
        siblings = "<h3>This page has these children:</h3><ul>" + siblings + '</ul>'

    print ("> Done!")
    return siblings

def createBreadcrumb(slug, title, path):
    print ("Creating breadcrumb for page " + slug + "...")
    path = re.sub('\.md$', '', path)
    pathItems = path.split('/')
    pathItems = pathItems[1:-1]
    print (pathItems)
    breadCrumbItems = ""    
    pathItemsLen = len(pathItems) - 1
    if len(pathItems) >= 1:
        for i, item in enumerate(pathItems):
            if slug != item:
                breadCrumbItems = breadCrumbItems + "<li><a href='" + item + ".html'>" + recreateTitle(item) + "</a></li>"

    breadCrumbStart = '<nav aria-label="Breadcrumb" class="breadcrumb"><ol>'
    breadCrumbEnd = '</ol></nav>'
    breadCrumb = breadCrumbStart + breadCrumbItems + breadCrumbEnd
    return breadCrumb


def generateHtmlPages(siteFolder, entries, template):
    print ("Creating html pages...")
    for entry in entries:
        # parentLink = createParentLink(entry[0], entry[1], entry[2], entries)
        breadcrumb = createBreadcrumb(entry[0], entry[1], entry[4])
        siblingsMenu = createSiblingsMenu(entry[0], entry[1], entry[2], entries)
        mainMenu = createMainMenu(entry[0], entry[1], entry[2], entries)
        pageTemplate = re.sub('pageTitle', entry[1], template)
        pageTemplate = re.sub('pageBody', entry[3], pageTemplate)
        pageTemplate = re.sub('parentLink', breadcrumb, pageTemplate)
        pageTemplate = re.sub('mainMenu', mainMenu, pageTemplate)
        pageTemplate = re.sub('pageMenuAlt', siblingsMenu, pageTemplate)

        print ("Generating file for " + entry[1] + "...")
        pageFile = open(siteFolder + entry[0] + ".html", "w")
        pageFile.write(pageTemplate)
        pageFile.close()
        print ("> Done!")
        print (" ")
    print ("All pages created!")

def getHtmlTemplate(templatePath):
    print ("Getting template file...")
    template = open(templatePath,'r')
    html = template.read()
    print ("> Done!")
    return html

def getPageContent(page):
    print ('Starting conversion from Markdown to HTML...')
    pageContent = open(page,'r')
    html = mistune.markdown(pageContent.read())
    print ("> Conversion is done!")
    return html

def getEntryTitle(page):
    print ("Getting page title...")
    pageContent = open(page,'r')
    textContent = pageContent.read()
    textContent = textContent.splitlines()
    textContent = textContent[0]
    textContent = textContent.replace('# ', '')
    print ('> Title is: "' + textContent + '"!')
    return textContent

def getEntrySlug(page):
    print ("Getting page slug...")
    slug = page.split("/")[-1]
    slug = re.sub('\.md$', '', slug)
    print ('> Slug is: "' + slug + '"!')
    return slug

def getEntryParent(slug, page):
    print ("Getting page parent...")
    menuLevel = -2
    parent = page.split("/")[menuLevel]
    if parent == slug:
        while parent == slug:
            menuLevel = menuLevel - 1
            parent = page.split("/")[menuLevel]
    if parent == "content":
        parent = "Home"
    print ('> Parent is: "' + parent + '"!')
    return parent

def createEntries(pages, media):
    fullContent = []
    print ('Starting entries creation...')
    for page in pages:
        tempPage = []
        slug = getEntrySlug(page)
        tempPage.append(slug)
        tempPage.append(getEntryTitle(page))
        parent = getEntryParent(slug, page)
        tempPage.append(parent)
        tempPage.append(getPageContent(page))
        tempPage.append(page)
        fullContent.append(tempPage)
        print (' ')
    return fullContent

def listPages(contentFolder):
    print ('Checking for pages...')
    pages = glob.glob(contentFolder + '**/*.md', recursive=True)
    print ('> Found ' + str(len(pages)) + ' pages in content folder!')
    return pages

def listFiles(mediaFolder):
    print ('Checking media files...')
    media = glob.glob(mediaFolder + '*.*')
    print ('> Found ' + str(len(media)) + ' media files in media folder!')
    return media

def deleteWebsite(siteFolder):
    print ('Checking for existing website...')
    siteExists = os.path.exists(siteFolder)
    if siteExists:
        print ('> Found it! Deleting existing website!')
        shutil.rmtree(siteFolder)
    print ('Creating the new dist folder...')
    os.mkdir(siteFolder)
    os.mkdir(siteFolder+"media")
    print ('> Done!')

def generateCss(siteFolder, path):
    print ('Generating CSS...')
    cssFile = os.path.exists(path)
    if cssFile:
        print ("Found CSS!")
        shutil.copy(path, siteFolder)
        print ("Css copied!")
    else:
        print ("No css file found!")

def convertImages():
    print ("Converting images...")
    subprocess.run('mogrify -path dist/media -filter Triangle -define filter:support=2 -thumbnail 1200 -unsharp 0.25x0.08+8.3+0.045 -dither None -posterize 136 -quality 82 -define jpeg:fancy-upsampling=off -define png:compression-filter=5 -define png:compression-level=9 -define png:compression-strategy=1 -define png:exclude-chunk=all -interlace none -colorspace sRGB media/*', shell=True) 
    print ('Done.')

def generateWebsite(siteFolder, mediaFolder, contentFolder, templateFile, cssPath):
    print (' ')
    print ('Welcome to the builder!')
    deleteWebsite(siteFolder)
    medias = listFiles(mediaFolder)
    pages = listPages(contentFolder)
    entries = createEntries(pages, medias)
    template = getHtmlTemplate(templateFile)
    generateHtmlPages(siteFolder, entries, template)
    generateCss(siteFolder, cssPath)
    #Convert images only if you need it during development
    # convertImages()

generateWebsite('dist/', 'media/', 'content/', 'partials/main.html', 'partials/style.css')