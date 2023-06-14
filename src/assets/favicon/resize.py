from PIL import Image


basewidth = 32
img = Image.open('logoO.png')
wpercent = (basewidth / float(img.size[0]))
hsize = int((float(img.size[1]) * float(wpercent)))
img = img.resize((basewidth, hsize), Image.ANTIALIAS)
img.save('favicon-32x32.png')
