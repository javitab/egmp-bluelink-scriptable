import version from '../version.json'

const ASSET_BINARY = 'egmp-bluelink.js'

export interface GithubRelease {
  version: string
  name: string
  date: string
  url: string
  assetName: string
  notes: string
}

export class Version {
  private currentVersion: string
  private githubLatestRelease: GithubRelease | undefined

  private githubUser: string
  private githubRepoName: string

  constructor(githubUser: string, githubRepoName: string) {
    this.githubRepoName = githubRepoName
    this.githubUser = githubUser
    this.currentVersion = version.version
    this.githubLatestRelease = undefined
  }

  public static versionToNumber(version: string): number {
    return Number(version.replace('v', '').replace(/\./g, ''))
  }

  public async promptForUpdate(): Promise<boolean> {
    const latestRelease = await this.getLatestGithubRelease()
    // releases are in the format v1.7.0 converted to number this ends up as 170. Hence we check for >= 10 (which corrolates to 0.1 or more)
    return Version.versionToNumber(latestRelease.version) - Version.versionToNumber(this.currentVersion) >= 10
  }

  public async getReleaseVersion(): Promise<string> {
    const latestRelease = await this.getLatestGithubRelease()
    return latestRelease.version
  }

  public getCurrentVersion(): string {
    return this.currentVersion
  }

  public async getRelease(): Promise<GithubRelease> {
    return await this.getLatestGithubRelease()
  }

  private async getLatestGithubRelease(): Promise<GithubRelease> {
    if (this.githubLatestRelease) {
      return this.githubLatestRelease
    }

    const url = `https://api.github.com/repos/${this.githubUser}/${this.githubRepoName}/releases/latest`
    const request = new Request(url)
    request.headers = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }

    let asseturl = ''
    const response = await request.loadJSON()
    for (const asset of response.assets) {
      if (asset.name === ASSET_BINARY) {
        asseturl = asset.browser_download_url
      }
    }

    this.githubLatestRelease = {
      version: response.tag_name,
      name: response.name,
      date: response.published_at,
      url: asseturl,
      assetName: ASSET_BINARY,
      notes: response.body,
    }
    return this.githubLatestRelease
  }
}
