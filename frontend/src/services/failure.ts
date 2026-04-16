import { API_BASE_URL, AuthRequestError } from './auth'

export type FailureProject = {
  id: number
  userId: number
  userName: string
  projectName: string
  githubUrl: string
  createdAt: string
}

type FailureProjectsResponse = {
  success: true
  result: {
    projects: FailureProject[]
  }
}

type FailureProjectResponse = {
  success: true
  result: {
    project: FailureProject
  }
}

type FailureErrorResponse = {
  success: false
  errors?: Array<{
    code: string
    message: string
  }>
}

function getErrorMessage(body: FailureErrorResponse | null, fallback: string): string {
  return body?.errors?.[0]?.message ?? fallback
}

export async function listFailureProjects(): Promise<FailureProject[]> {
  const response = await fetch(`${API_BASE_URL}/failure/projects`, {
    headers: { Accept: 'application/json' },
    credentials: 'include',
    cache: 'no-store',
  })

  if (!response.ok) {
    let body: FailureErrorResponse | null = null

    try {
      body = (await response.json()) as FailureErrorResponse
    } catch {
      body = null
    }

    throw new AuthRequestError(getErrorMessage(body, '失败项目列表加载失败'), response.status)
  }

  const body = (await response.json()) as FailureProjectsResponse

  return body.result.projects
}

export async function createFailureProject(input: {
  projectName: string
  githubUrl: string
}): Promise<FailureProject> {
  const response = await fetch(`${API_BASE_URL}/failure/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    let body: FailureErrorResponse | null = null

    try {
      body = (await response.json()) as FailureErrorResponse
    } catch {
      body = null
    }

    throw new AuthRequestError(getErrorMessage(body, '失败项目上传失败'), response.status)
  }

  const body = (await response.json()) as FailureProjectResponse

  return body.result.project
}
