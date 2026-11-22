import { pending_game_slice } from '@/src/slices/pending_game_slice'
import type { GameCredentials } from '@domain/model/uno.dto.ts'
import {useRouter} from "next/navigation";
import {Dispatch} from "@/src/stores/store";

type Router = ReturnType<typeof useRouter>

/**
 * Returns a thunk that keeps the name and password selected in the lobby page, navigates the user to the host page and pre-fills the typed game name and password.
 */
export default function PrepareHostThunk(credentials: GameCredentials, router: Router): (dispatch: Dispatch) => Promise<void> {
  return async (dispatch: Dispatch): Promise<void> => {
    dispatch(pending_game_slice.actions.hostPrepared(credentials))

    router.push(`/host`)
  }
}
