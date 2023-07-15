import { HiOutlinePlusCircle } from "solid-icons/hi";
import { useSupabase } from "../Providers/SupabaseProvider";
import { A, useNavigate } from "solid-start";
import { Profile } from "../Providers/ProfileProvider";
import { Show } from "solid-js";

interface Props {
  profile: Profile;
}

export default function NavBar(props: Props) {
  const supabase = useSupabase();
  const navigate = useNavigate();

  return (
    <div class="navbar bg-transparent rounded-b-lg pt-4">
      <div class="navbar-start flex-1 flex items-center">
        <label
          for="index-drawer"
          class="btn btn-square drawer-button btn-ghost lg:hidden"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            class="inline-block w-6 h-6 stroke-current"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        </label>
      </div>
      <div class="flex-none gap-6 mr-2">
        <div class="dropdown dropdown-end justify-end mr-2">
          <label tabindex="0" class="btn btn-ghost btn-circle avatar">
            <div class="w-10 rounded-full">
              <img src={props.profile.picture_url as string} />
            </div>
          </label>
          <ul
            tabindex="0"
            class="mt-3 p-2 shadow menu menu-compact dropdown-content bg-base-100 rounded-box w-52"
          >
            <li>
              <a class="justify-between pointer-events-none">
                <span class="badge">Hello</span>
                {props.profile.name}
              </a>
            </li>
            <li>
              <A href="/settings">Settings</A>
            </li>
            <li>
              <a
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate("/login", { replace: true });
                }}
              >
                Logout
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
