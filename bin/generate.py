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

def createMainMenu(entries):
    print ("Creating main menu...")
    menu = "<h3>Main menu:</h3><ul>"
    for key, val in entries.items():
        if len(val['path']) == 1:
            menu = menu + "<li><a href='" + val['slug'] + ".html'>" + val['title'] + "</a></li>"
        
    menu = menu + '</ul>'
    print ("> Done!")
    return menu

def createSubMenu(entry, entries):
    print ("Creating siblings menu for " + entry['title'] + "...")
    string = ''
    for key, val in entries.items():
        if entry['parent'] == key:
            print ("We are treating " + key)
            print(val)
            if val['slug'] != entry['slug']:
                string = string + "<li><a href='" + val['slug'] + ".html'>" + val['title'] + "</a></li>"
    if string != "":
        string = "<h3>This page has these siblings:</h3><ul>" + string + '</ul>'

    print ("> Done!")
    return string

def createBreadcrumb(slug, path):
    print ("Creating breadcrumb for page " + slug + "...")
    breadCrumbItems = ""    
    pathItemsLen = len(path) - 1
    if len(path) >= 1:
        for i, item in enumerate(path):
            if slug != item:
                breadCrumbItems = breadCrumbItems + "<li><a href='" + item + ".html'>" + recreateTitle(item) + "</a><span aria-hidden='true'>&nbsp; &#x2935</span></li>"

    if breadCrumbItems != '':
        breadCrumbStart = '<nav aria-label="Breadcrumb" class="breadcrumb"><ol>'
        breadCrumbEnd = '</ol></nav>'
        breadCrumb = breadCrumbStart + breadCrumbItems + breadCrumbEnd
        print ("> Breadcrumb done!")
        return breadCrumb
    else:
        print ('Noting in breadcrumb')
        return ""


def generateHtmlPages(siteFolder, entries, mainMenu,  template):
    print ("Creating html pages...")
    print(entries)
    for key, val in entries.items():
        print(val)
        breadcrumb = createBreadcrumb(val['slug'], val['path'])

        siblingsMenu = createSubMenu(val, entries)
        pageTemplate = re.sub('pageTitle', val['parent'], template)
        pageTemplate = re.sub('pageBody', val['pageContent'], pageTemplate)
        pageTemplate = re.sub('parentLink', breadcrumb, pageTemplate)
        pageTemplate = re.sub('mainMenu', mainMenu, pageTemplate)
        pageTemplate = re.sub('pageMenuAlt', siblingsMenu, pageTemplate)


        print ("Generating file for " + val['parent'] + "...")
        pageFile = open(siteFolder + val['slug'] + ".html", "w")
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
    if slug:
        print ('What is slug? ' + slug)
        return slug
    else:
        return ''

def getSiblings(entries):
    print ('Creating siblings...')
    
    complete = {}
    for entry in entries:
        siblingEntries = []
        childrenEntries = []

        for entry2 in entries:
            #Creation des pages jumelles
            if entry['parent'] == entry2['parent'] and entry['slug'] != entry2['slug'] and entry['slug'] != entry['parent']:
                tempEntries = {}
                tempEntries['title'] = entry2['title']
                tempEntries['slug'] = entry2['slug']
                siblingEntries.append(tempEntries)
            
            if entry['slug'] == entry2['parent'] and entry2['slug'] != entry2['parent']:
                tempChild = {}
                tempChild['title'] = entry2['title']
                tempChild['slug'] = entry2['slug']
                childrenEntries.append(tempChild)

        if len(siblingEntries) >= 1:
            entry['siblings'] =  siblingEntries               
        if len(childrenEntries) >= 1:
            entry['children'] =  childrenEntries
        
        complete[entry['slug']] = entry
    return complete

def createEntries(pages, media):
    fullContent = []
    print ('Starting entries creation...')

    for page in pages:
        tempPage = {}

        path = cleanPath(page)
        parent = ''
        grandParent = ''
        slug = ''

        if len(path) >= 2:
            if path[-1] == path[-2]:
                parent = path[-1]
                if len(path) >= 3:
                    grandParent = path[-3]
                path = path[:-1]
            else:
                parent = path[-2]
            print ("Parent is... " + parent)
        
            if len(path) >= 1:
                slug = path[-1]
                print ("slug is... " + slug)
        
        # if slug == 
        title = getEntryTitle(page)
        pageContent = getPageContent(page)

        tempPage['slug'] = slug
        tempPage['parent'] = parent
        if grandParent != '':
            tempPage['grandParent'] = grandParent
        tempPage['title'] =title
        tempPage['pageContent'] = pageContent
        tempPage['path'] = path

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

def cleanPath(path):
    print ('Cleaning the path ' + path + ' for future use...')
    path = re.sub('\.md$', '', path)
    pathItems = path.split('/')
    pathItems = pathItems[1:]
    print (pathItems)
    print ("> Done !")
    return pathItems

def generateWebsite(siteFolder, mediaFolder, contentFolder, templateFile, cssPath):
    print (' ')
    print ('Welcome to the builder!')
    deleteWebsite(siteFolder)
    medias = listFiles(mediaFolder)
    pages = listPages(contentFolder)
    entries = createEntries(pages, medias)
    siblings = getSiblings(entries)
    template = getHtmlTemplate(templateFile)
    mainMenu = createMainMenu(siblings)
    generateHtmlPages(siteFolder, siblings, mainMenu, template)
    generateCss(siteFolder, cssPath)
    #Convert images only if you need it during development
    convertImages()

generateWebsite('dist/', 'media/', 'content/', 'partials/main.html', 'partials/style.css')