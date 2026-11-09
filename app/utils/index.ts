// 获取文件后缀名
export const getFileSuffix = (fileName: string) => {
  const lastIndexOf = fileName.lastIndexOf('.')
  if (lastIndexOf === -1) {
    return ''
  }
  const fileSuffix = fileName.substring(lastIndexOf + 1)
  return fileSuffix
}

// File to ArrayBuffer
export const fileToArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      resolve(e.target?.result as ArrayBuffer)
    }
    reader.onerror = (err) => {
      reject(err)
    }
    reader.readAsArrayBuffer(file)
  })
}

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      resolve(e.target?.result as string)
    }
    reader.onerror = (err) => {
      reject(err)
    }
    reader.readAsDataURL(file)
  })
}

// isImgExt
export const isImgExt = (fileName: string) => {
  const fileSuffix = getFileSuffix(fileName)
  const imgExt = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tif', 'psd', 'svg', 'tga', 'ico', 'raw', 'bpg', 'jxr', 'hdp', 'hdp', 'heif', 'heic', 'indd', 'indt', 'eps', 'ps', 'svgz', 'ind', 'indb']
  return imgExt.includes(fileSuffix)
}

// getFilename
export const getFilename = (fileName: string) => {
  const lastIndexOf = fileName.lastIndexOf('.')
  return fileName.slice(0, lastIndexOf)
}
