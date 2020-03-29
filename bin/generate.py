import os
import shutil
import glob
import re
mistune = __import__('mistune')

def createMainMenu(slug, title, parent, entries):
    print ("Creating main menu for " + title + "...")
   
    return "null"

def createSiblingsMenu(slug, title, parent, entries):
    print ("Creating siblings menu for " + parent + "...")
    siblings = ""
    for entry in entries:
        if entry[2] == parent and entry[0] != parent:
            if(entry[0] == slug):
                siblings = siblings + "<li><a class='active' href='" + entry[0] + ".html'>" + entry[1] + "</a></li>"
            else:
                siblings = siblings + "<li><a href='" + entry[0] + ".html'>" + entry[1] + "</a></li>"
    siblings = siblings + '</ul>'
    print ("> Done!")
    return siblings

def createParentLink(parent, entries):
    print ("Creating parent title for " + parent + "...")
    title = "Root"
    for entry in entries:
        if entry[0] == parent:
             title = entry[1]
    parentLink = "<h3>This page is part of <a href='" + parent + ".html'>" + title + "</a></h3><ul>"
    print ("> Done!")
    return parentLink

def generateHtmlPages(siteFolder, entries, template):
    print ("Creating html pages...")
    for entry in entries:
        parentLink = createParentLink(entry[2], entries)
        siblingsMenu = createSiblingsMenu(entry[0], entry[1], entry[2], entries)
        mainMenu = createMainMenu(entry[0], entry[1], entry[2], entries)
        pageTemplate = re.sub('pageTitle', entry[1], template)
        pageTemplate = re.sub('pageBody', entry[3], pageTemplate)
        pageTemplate = re.sub('parentLink', parentLink, pageTemplate)
        pageTemplate = re.sub('mainMenu', mainMenu, pageTemplate)
        pageTemplate = re.sub('pageMenuAlt', siblingsMenu, pageTemplate)
        print ("Generating file for " + entry[4] + "...")
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

def getEntryParent(page):
    print ("Getting page parent...")
    parent = page.split("/")[-2]
    print ('> Parent is: "' + parent + '"!')
    return parent

def createEntries(pages, media):
    fullContent = []
    print ('Starting entries creation...')
    for page in pages:
        tempPage = []
        tempPage.append(getEntrySlug(page))
        tempPage.append(getEntryTitle(page))
        tempPage.append(getEntryParent(page))
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
    print ('> Done!')

def generateWebsite(siteFolder, mediaFolder, contentFolder, templateFile):
    print (' ')
    print ('Welcome to the builder!')
    deleteWebsite(siteFolder)
    medias = listFiles(mediaFolder)
    pages = listPages(contentFolder)
    entries = createEntries(pages, medias)
    template = getHtmlTemplate(templateFile)
    generateHtmlPages(siteFolder, entries, template)


generateWebsite('dist/', 'media/', 'content/', 'partials/main.html')