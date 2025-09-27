async function main() {
    document.body.style.minHeight = '100dvh'
    document.body.ondragover = e => e.preventDefault()
    document.body.ondrop = async e => {
        e.preventDefault();
        let area = document.getElementById('area')
        area?.remove()
        let { img, json } = await genAltas([...e.dataTransfer.files])
        img.id = 'area'
        img.style.outline = '1px solid yellowgreen'
        img.style.height = 'calc(100dvh - 60px)'

        let main = document.getElementsByTagName('main')[0]
        main.innerHTML = ''
        main.appendChild(img)

        let btnAtlas = document.getElementById('dl_atlas')
        btnAtlas.disabled = false
        btnAtlas.onclick = () => {
            let fname = 'atlas'
            if (fname = prompt('Please Enter Image File Name', fname)) {
                saveImageFile(img, fname)
            }
        }
        let btnJSON = document.getElementById('dl_json')
        btnJSON.disabled = false
        btnJSON.onclick = () => {
            let fname = 'atlas.json'
            if (fname = prompt('Please Enter JSON File Name', fname)) {
                saveTextAsFile(JSON.stringify(json), fname)
            }
        }
        let btnSample = document.getElementById('sample')
        btnSample.disabled = false
        btnSample.onclick = () => {
            fetch('parse.txt').then(r => r.text()).then(r => {
                saveTextAsFile(r, 'sample.html')
            })
        }
    }

    function saveImageFile(canvas, fileName) {
        // save image
        const dataURL = canvas.toDataURL('image/png')
        const downloadLink = document.createElement('a')
        downloadLink.download = fileName
        downloadLink.href = dataURL
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
    }

    function saveTextAsFile(text, fileName) {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
        const downloadLink = document.createElement('a')
        downloadLink.download = fileName
        downloadLink.href = window.URL.createObjectURL(blob)
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
        window.URL.revokeObjectURL(downloadLink.href)
    }

    async function genAltas(files) {
        let imgs = files.map(file => new Promise(resolve => {
            let freader = new FileReader
            freader.onload = e => {
                freader.onload = null
                let img = new Image
                img.onload = () => {
                    img.onload = null
                    img.name = file.name
                    resolve(img)
                }
                img.src = e.target.result
            }
            freader.readAsDataURL(file)
        }))
        imgs = await Promise.all(imgs)

        let canvasW = 100
        let canvasH = 100
        let cv = document.createElement('canvas')
        cv.width = canvasW
        cv.height = canvasH
        let ctx = cv.getContext('2d')
        ctx.fillStyle = `#666`
        ctx.fillRect(0, 0, canvasW, canvasH)
        ctx.fill()

        let p = new Packer(canvasW, canvasH);
        let blocks = imgs.map(img => ({ img, w: img.naturalWidth, h: img.naturalHeight }))
        p.fit(blocks);
        while (blocks.length != blocks.filter(block => block.x0 != null).length) {
            canvasW += 5
            canvasH += 5
            cv.width = canvasW
            cv.height = canvasH
            let p = new Packer(canvasW, canvasH);
            blocks = imgs.map(img => ({ img, w: img.naturalWidth, h: img.naturalHeight }))
            p.fit(blocks);
        }

        let jsonOutput = {}

        blocks.forEach(block => {
            let { img, w, h, x0, y0, rotate } = block
            if (rotate) {
                ctx.save()
                ctx.translate(x0 + w, y0)
                ctx.rotate(90 / 180 * Math.PI)
                ctx.translate(-x0, -y0)
                ctx.drawImage(img, x0, y0)
                ctx.restore()
            } else {
                ctx.drawImage(img, x0, y0)
            }

            let name = img.name//.split('/').pop()
            if (jsonOutput[name]) {
                jsonOutput[name + '_' + Date.now().toString().slice(7) + '_' + ~~(Math.random() * 10000)] = { x: x0, y: y0, w, h, isRotate: rotate }
            } else {
                jsonOutput[name] = { x: x0, y: y0, w, h, isRotate: rotate }
            }
        })
        let mxw = Math.max(...blocks.map(block => block.x1))
        let mxh = Math.max(...blocks.map(block => block.y1))
        let crop = document.createElement('canvas')
        crop.width = mxw
        crop.height = mxh
        let cropCtx = crop.getContext('2d')
        cropCtx.drawImage(cv, 0, 0)

        return Promise.resolve({ img: crop, json: jsonOutput })
    }
}
main()