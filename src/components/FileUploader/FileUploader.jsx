import { useState, useEffect } from "react"
import { useDropzone } from "react-dropzone"

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID
const FOLDER_ID = import.meta.env.VITE_FOLDER_ID

const FileUploader = () => {
  const [auth, setAuth] = useState(null)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const storedAuth = getCookie("authToken")
    if(storedAuth){
      setAuth(storedAuth)
    }
  }, [])

  const onDrop = async (acceptedFiles) => {
    if(!auth){
      alert("Zaloguj się za pomocą konto google aby móc dodać zdjęcia")
      return
    }

    setUploading(true)

    for(const file of acceptedFiles){
      const metadata = {
        name: file.name,
        mimeType: file.type,
        parents: [FOLDER_ID],
      }

      const formData = new FormData()
      formData.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" })
      )
      formData.append("file", file)

      try{
        const response = await fetch(
          "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${auth}`,
            },
            body: formData
          }
        )

        const result = await response.json()
        setUploadedFiles((prev) => [...prev, result])
      }catch(error){
        console.error("Błąd przy dodawaniu zdjęcia:", error)
        alert("Nie udało się dodać zdjęcia. Proszę spróbuj ponownie")
      }
    }

    setUploading(false)
  }

  const authenticate = () => {
    if(!window.google){
      alert("Sprawdz połączenie z internetem")
      return
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: "https://www.googleapis.com/auth/drive.file",
      redirect_uri: "https://wspomnienia-slubu.netlify.app",
      callback: (response) => {
        if(response.error){
          console.error("Błąd przy logowaniu:", response.error)
          alert("Błąd przy logowaniu. Proszę spróbuj ponownie")
          return
        }
        setAuth(response.access_token)
        setCookie("authToken", response.access_token, 7)
      }
    })

    tokenClient.requestAccessToken()
  }

  const setCookie = (name, value, days) => {
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
  }

  const getCookie = (name) => {
    const nameEQ = `${name}=`
    const ca = document.cookie.split(";")
    for(let i = 0; i < ca.length; i++){
      let c = ca[i]
      while (c.charAt(0) == " ") c = c.substring(1, c.length)
      if(c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length)
    }
    return null
  }

  const { getRootProps, getInputProps } = useDropzone({ onDrop })

  return(
    <div>
      {!auth ? (
        <button onClick={authenticate}>Zaloguj się przy pomocy konta google</button>
      ) : (
        <p>Jesteś zalogowany możesz już dodawać zdjęcia</p>
      )}

      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <p>Przeciągnij zdjęcia tutaj, albo kliknij i wybierz które chcesz dodać</p>
      </div>

      {uploading && <p>Dodawanie zdjęć...</p>}

      <div>
        <h2>Zdjęcia które udało ci się dodać</h2>
        <ul>
          {uploadedFiles.map((file) => (
            <li key={file.id}>{file.name}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default FileUploader