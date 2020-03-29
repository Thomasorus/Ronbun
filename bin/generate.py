import os
import shutil
import glob
import re
# import importlib
mistune = __import__('mistune')

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
    pass

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

def generateWebsite(siteFolder, mediaFolder, contentFolder):
    print (' ')
    print ('Welcome to the builder!')
    deleteWebsite(siteFolder)
    medias = listFiles(mediaFolder)
    pages = listPages(contentFolder)
    entries = createEntries(pages, medias)


generateWebsite('dist/', 'media/', 'content/')