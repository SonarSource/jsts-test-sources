import * as Fs from 'fs'
import * as Path from 'path'

/**
 * Type representing the contents of the gemoji json database
 * which consists of a top-level array containing objects describing
 * emojis.
 */
type IGemojiDb = ReadonlyArray<IGemojiDefinition>

/**
 * Partial (there's more in the db) interface describing the elements
 * in the gemoji json array.
 */
interface IGemojiDefinition {
  /**
   * The unicode string of the emoji if emoji is part of
   * the unicode specification. If missing this emoji is
   * a GitHub custom emoji such as :shipit:
   */
  readonly emoji?: string

  /** One or more human readable aliases for the emoji character */
  readonly aliases: ReadonlyArray<string>

  /** An optional, human readable, description of the emoji  */
  readonly description?: string
}

export class EmojiStore {
  /** Map from shorcut (e.g., :+1:) to on disk URL. */
  public readonly emoji = new Map<string, string>()

  private getEmojiImageUrlFromRelativePath(relativePath: string): string {
    return `file://${Path.join(__dirname, 'emoji', relativePath)}`
  }

  /**
   * Given a unicode point number, returns a hexadecimal string
   * which is lef padded with zeroes to be at least 4 characters
   */
  private getHexCodePoint(cp: number): string {
    const str = cp.toString(16)

    // The combining characters are always stored on disk
    // as zero-padded 4 character strings. Don't ask me why.
    return str.length >= 4
      ? str
      : ('0000' + str).substring(str.length)
  }

  /**
   * Returns a url to the on disk location of the image
   * representing the given emoji or null in case the
   * emoji unicode string was invalid.
   */
  private getUrlFromUnicodeEmoji(emoji: string): string | null {

    const codePoint = emoji.codePointAt(0)

    if (!codePoint) {
      return null
    }

    let filename = this.getHexCodePoint(codePoint)

    // Some emoji are composed of two unicode code points, they're
    // usually variants of the same theme (like :one:, :two: etc)
    // and they're stored on disk as CP1-CP2.
    if (emoji.length > 2) {
      const combiningCodePoint = emoji.codePointAt(2)

      // 0xfe0f is VARIATION SELECTOR-16 which, best as I can tell means
      // make the character before me all fancy pants. I don't know why
      // but gemoji explicitly excludes this from its naming scheme so
      // we'll do the same.
      if (combiningCodePoint && combiningCodePoint !== 0xfe0f) {
        filename = `${filename}-${this.getHexCodePoint(combiningCodePoint)}`
      }
    }

    return this.getEmojiImageUrlFromRelativePath(`unicode/${filename}.png`)
  }

  /** Read the stored emoji list from JSON into an in-memory representation.
   *
   * @param rootDir - The folder containing the entry point (index.html or main.js) of the application.
   */
  public read(rootDir: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {

      const path = Path.join(rootDir, 'emoji.json')
      Fs.readFile(path, 'utf8', (err, data) => {

        if (err) {
          reject(err)
          return
        }

        const tmp = new Map<string, string>()

        try {
          const db: IGemojiDb = JSON.parse(data)
          db.forEach(emoji => {

            // Custom emoji don't have a unicode string and are instead stored
            // on disk as their first alias.
            const url = emoji.emoji
              ? this.getUrlFromUnicodeEmoji(emoji.emoji)
              : this.getEmojiImageUrlFromRelativePath(`${emoji.aliases[0]}.png`)

            if (!url) {
              console.error('Could not calculate location of emoji', emoji)
              return
            }

            emoji.aliases.forEach(alias => {
              tmp.set(`:${alias}:`, url)
            })
          })
        } catch (e) {
          reject(e)
        }

        // Sort and insert into actual map
        const keys = Array.from(tmp.keys()).sort()
        keys.forEach(k => {
          const value = tmp.get(k)
          if (value) {
            this.emoji.set(k, value)
          }
        })

        resolve()
      })
    })
  }
}
