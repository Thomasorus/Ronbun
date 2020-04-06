import os
import shutil
import glob
import re
mistune = __import__('mistune')
import subprocess

# def recreateTitle(slug):
#     title = re.sub('-', ' ', slug);
#     title = title.title()
#     return title

# Creates main menu from entries by checking the lenght of their path and selecting only 
# the ones who have a single object in their path
def createMainMenu(entries):
    menu = "<h3>Main menu:</h3><ul>"
    for key, val in entries.items():
        if len(val['path']) == 1:
            menu = menu + "<li><a href='" + val['slug'] + ".html'>" + val['title'] + "</a></li>"
    menu = menu + '</ul>'
    return menu

# Creates html submenu from the siblings or children dictionnay in the entry
def createSubMenu(entry):
    string = ''
    if "siblings" in entry:
        for item in entry['siblings']:
            string = string + "<li><a href='" + item['slug'] + ".html'>" + item['title'] + "</a></li>"
        if string != "":
           string = "<h3>This page has these siblings:</h3><ul>" + string + '</ul>'
    elif 'children' in entry:
        for item in entry['children']:
            string = string + "<li><a href='" + item['slug'] + ".html'>" + item['title'] + "</a></li>"
        if string != "":
            string = "<h3>This page has these children:</h3><ul>" + string + '</ul>'
    return string

# Creates breadcrumb by using the path items and finding corresponding details in entries
def createBreadcrumb(key, entry, entries):
    breadCrumbItems = ""  
    entryPath = entry['path'][:-1]  
    pathItemsLen = len(entry['path']) - 1
    if len(entryPath) >= 1:
        for i, item in enumerate(entryPath):
            for key, val in entries.items():
                print (key, val)
                if val['slug'] == item:
                    breadCrumbItems = breadCrumbItems + "<li><a href='" + val['slug'] + ".html'>" + val['title'] + "</a><span aria-hidden='true'>&nbsp; &#x2935</span></li>"

    if breadCrumbItems != '':
        breadCrumbStart = '<nav aria-label="Breadcrumb" class="breadcrumb"><ol>'
        breadCrumbEnd = '</ol></nav>'
        breadCrumb = breadCrumbStart + breadCrumbItems + breadCrumbEnd
        return breadCrumb
    else:
        return ""
    return ""

# Generates html files in the site folder, using the entries and the template.
# Also triggers the creation of the breadcrumb and the submenu
def generateHtmlPages(siteFolder, entries, mainMenu, template):
    for key, val in entries.items():
        breadcrumb = createBreadcrumb(key, val, entries)
        siblingsMenu = createSubMenu(val)

        pageTemplate = re.sub('pageTitle', val['parent'], template)
        pageTemplate = re.sub('pageBody', val['pageContent'], pageTemplate)
        pageTemplate = re.sub('parentLink', breadcrumb, pageTemplate)
        pageTemplate = re.sub('mainMenu', mainMenu, pageTemplate)
        pageTemplate = re.sub('pageMenuAlt', siblingsMenu, pageTemplate)

        pageFile = open(siteFolder + val['slug'] + ".html", "w")
        pageFile.write(pageTemplate)
        pageFile.close()
    print ("All pages created!")

# Recovers the html template to be used on the website
def getHtmlTemplate(templatePath):
    template = open(templatePath,'r')
    html = template.read()
    return html

# Parses markdown and converts it to html
def getPageContent(page):
    pageContent = open(page,'r')
    html = mistune.markdown(pageContent.read())
    return html

# Get title by parsing and cleaning the first line of the markdown file
def getEntryTitle(page):
    pageContent = open(page,'r')
    textContent = pageContent.read()
    textContent = textContent.splitlines()
    textContent = textContent[0]
    textContent = textContent.replace('# ', '')
    return textContent

# Get the slug from the markdown file name
def getEntrySlug(page):
    slug = page.split("/")[-1]
    slug = re.sub('\.md$', '', slug)
    if slug:
        return slug
    else:
        return ''

# Using the parent and grandParent keys, creates the siblings or children arrays who
# will be later used for creating submenus
def getSiblings(entries):    
    complete = {}
    for entry in entries:
        siblingEntries = []
        childrenEntries = []

        for entry2 in entries:
            if entry['parent'] == entry2['parent'] and entry['slug'] != entry2['slug'] and entry2['slug'] != entry2['parent']:
                tempEntries = {}
                tempEntries['title'] = entry2['title']
                tempEntries['slug'] = entry2['slug']
                siblingEntries.append(tempEntries)
            
            if entry['slug'] == entry2['parent'] and entry['slug'] != entry2['slug'] and entry2['slug'] != entry2['parent']:
                tempChild = {}
                tempChild['title'] = entry2['title']
                tempChild['slug'] = entry2['slug']
                childrenEntries.append(tempChild)
            
            if 'grandParent' in entry2 and entry['slug'] == entry2['grandParent']:
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

# From the list of files, creates the main array of entries that will be processed later
def createEntries(pages):
    fullContent = []
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
        
            if len(path) >= 1:
                slug = path[-1]
        
        if slug == '':
            slug = 'index'
            
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
    return fullContent

# Recursively gather all files locations into an array
def listPages(contentFolder):
    pages = glob.glob(contentFolder + '**/*.md', recursive=True)
    return pages

# Deletes existing dist folder and its content then recreates it
# as well as the media folder
def deleteWebsite(siteFolder):
    siteExists = os.path.exists(siteFolder)
    if siteExists:
        shutil.rmtree(siteFolder)
    os.mkdir(siteFolder)
    os.mkdir(siteFolder+"media")
    os.mkdir(siteFolder+"assets")

# Copies css source to dist
def moveAssets(siteFolder, path):
    assets = os.listdir(path)
    if assets:
        for asset in assets:
            asset = os.path.join(path, asset)
            if os.path.isfile(asset):
                shutil.copy(asset, siteFolder+path)
    else:
        print ("No assets found!")

# Bash script using image magick to convert images and move them to dist/media
def convertImages():
    print ("Converting images...")
    subprocess.run('mogrify -path dist/media -filter Triangle -define filter:support=2 -thumbnail 1200 -unsharp 0.25x0.08+8.3+0.045 -dither FloydSteinberg -type Grayscale -colors 2 -posterize 136 -quality 82 -define jpeg:fancy-upsampling=off -define png:compression-filter=5 -define png:compression-level=9 -define png:compression-strategy=1 -define png:exclude-chunk=all -interlace none -colorspace sRGB media/*', shell=True) 
    print ('Done.')

# Transforms the file locations to an array of strings
def cleanPath(path):
    path = re.sub('\.md$', '', path)
    pathItems = path.split('/')
    pathItems = pathItems[1:]
    return pathItems

# Main function, generates the website
def generateWebsite(siteFolder, contentFolder, templateFile, assetsPath):
    print (' ')
    print ('Welcome to the builder!')
    deleteWebsite(siteFolder)
    pages = listPages(contentFolder)
    entries = createEntries(pages)
    siblings = getSiblings(entries)
    template = getHtmlTemplate(templateFile)
    mainMenu = createMainMenu(siblings)
    generateHtmlPages(siteFolder, siblings, mainMenu, template)
    moveAssets(siteFolder, assetsPath)
    # Convert images only if you need it during development
    convertImages()

generateWebsite('dist/', 'content/', 'partials/main.html', 'assets/')