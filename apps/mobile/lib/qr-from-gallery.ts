import * as ImagePicker from "expo-image-picker"
import { ImageManipulator, SaveFormat } from "expo-image-manipulator"
import jsQR from "jsqr"
import jpeg from "jpeg-js"

const MAX_IMAGE_SIZE = 1024
const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

function base64ToBytes(value: string): Uint8Array {
  const cleanValue = value.replace(/[^A-Za-z0-9+/]/g, "")
  const bytes = new Uint8Array(Math.floor((cleanValue.length * 3) / 4))

  let byteIndex = 0
  for (let index = 0; index < cleanValue.length; index += 4) {
    const first = BASE64_CHARS.indexOf(cleanValue[index])
    const second = BASE64_CHARS.indexOf(cleanValue[index + 1])
    const third = BASE64_CHARS.indexOf(cleanValue[index + 2])
    const fourth = BASE64_CHARS.indexOf(cleanValue[index + 3])

    bytes[byteIndex++] = (first << 2) | (second >> 4)
    if (third >= 0 && byteIndex < bytes.length) {
      bytes[byteIndex++] = ((second & 15) << 4) | (third >> 2)
    }
    if (fourth >= 0 && byteIndex < bytes.length) {
      bytes[byteIndex++] = ((third & 3) << 6) | fourth
    }
  }

  return bytes
}

export async function importQrFromGallery(): Promise<string | null> {
  const pickerResult = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 1,
  })

  if (pickerResult.canceled) return null

  const asset = pickerResult.assets[0]
  if (!asset) throw new Error("No image selected")

  const manipulator = ImageManipulator.manipulate(asset.uri)
  const maxDimension = Math.max(asset.width, asset.height)

  if (maxDimension > MAX_IMAGE_SIZE) {
    if (asset.width >= asset.height) {
      manipulator.resize({ width: MAX_IMAGE_SIZE })
    } else {
      manipulator.resize({ height: MAX_IMAGE_SIZE })
    }
  }

  const renderedImage = await manipulator.renderAsync()
  const imageResult = await renderedImage.saveAsync({
    base64: true,
    compress: 1,
    format: SaveFormat.JPEG,
  })

  if (!imageResult.base64) throw new Error("Unable to read selected image")

  const decodedImage = jpeg.decode(base64ToBytes(imageResult.base64), {
    useTArray: true,
  })
  const qrCode = jsQR(
    new Uint8ClampedArray(decodedImage.data),
    decodedImage.width,
    decodedImage.height,
  )

  if (!qrCode) throw new Error("No QR code found in selected image")
  return qrCode.data
}
