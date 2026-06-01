import axios from 'axios'

type ApiErrorBody = {
  message?: string
  error?: string
}

export function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      return 'Unable to connect — check your connection and make sure the app is online.'
    }
    const status = error.response.status
    if (status === 401 || status === 403) {
      return 'Session expired — please sign in again.'
    }
    if (status === 404) {
      return 'Data not found.'
    }
    if (status >= 500) {
      return 'GoFit servers are temporarily unavailable. Please try again in a moment.'
    }
    return (
      error.response.data?.message ??
      error.response.data?.error ??
      `Something went wrong (${status}).`
    )
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong.'
}
