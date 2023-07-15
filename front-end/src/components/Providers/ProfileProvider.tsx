import { SupabaseClient } from "@supabase/supabase-js";
import {
  createSignal,
  createContext,
  useContext,
  createEffect,
  onCleanup,
  Accessor,
  Setter,
} from "solid-js";
import { Database } from "~/types/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface Props {
  children: any;
}

const EMPTY_PROFILE: Profile = {
  id: "",
  name: "",
  picture_url: "",
  active_index: "",
  max_pages: 0,
  pages_uploaded: 0,
  payment_type: "",
  created_at: "",
  customer_id: null,
  index_status : "",
};

const ProfileContext = createContext<[Accessor<Profile>, Setter<Profile>]>();

export function ProfileProvider(props: Props) {
  const [profile, setProfile] = createSignal<Profile>(EMPTY_PROFILE);

  return (
    <ProfileContext.Provider value={[profile, setProfile]}>
      {props.children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext) as [Accessor<Profile>, Setter<Profile>];
}
