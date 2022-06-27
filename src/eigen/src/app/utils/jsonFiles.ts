import { Echo } from "app/store/config/EchoModel"
import appJsonFile from "../../../app.json"
import echoLaunchJsonFile from "../../../ios/Artsy/App/EchoNew.json"

export const appJson = () => appJsonFile
export const echoLaunchJson = (): Echo => echoLaunchJsonFile
