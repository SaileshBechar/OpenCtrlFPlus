import { Profile } from "./Providers/ProfileProvider";

interface Props {
  profile: Profile;
}
export default function ProfileSettings(props: Props) {
  return (
    <main class="flex flex-col justify-center gap-14">
      <div class="inline-flex gap-6 items-center justify-center">
        <div class="avatar mt-4">
          <div class="w-12 rounded-full">
            <img src={props.profile.picture_url as string} />
          </div>
        </div>
        <div class="form-control w-full max-w-xs">
          <label class="label">
            <span class="label-text">Name:</span>
          </label>
          <input
            type="text"
            placeholder={props.profile.name as string}
            class="input input-bordered w-full max-w-xs"
            disabled
          />
        </div>
      </div>
      <div class="inline-flex">
        <div class="text-xl font-bold">Pages Uploaded This Month: </div>
        <div
          class="text-xl font-bold ml-8 bg-clip-text text-transparent"
          classList={{
            "bg-warning":
              props.profile.pages_uploaded / props.profile.max_pages >= 0.9 &&
              props.profile.pages_uploaded !== props.profile.max_pages,
            "bg-error":
              props.profile.pages_uploaded === props.profile.max_pages,
            "bg-secondary":
              props.profile.pages_uploaded / props.profile.max_pages < 0.9,
          }}
        >
          {props.profile.pages_uploaded}
          <span
            class="bg-clip-text text-transparent btn-gradient"
            classList={{
              "from-warning":
                props.profile.pages_uploaded / props.profile.max_pages >=
                  0.65 &&
                props.profile.pages_uploaded / props.profile.max_pages < 0.9,
              "from-red-600 to-warning":
                props.profile.pages_uploaded / props.profile.max_pages >= 0.9 &&
                props.profile.pages_uploaded !== props.profile.max_pages,
              "from-red-600 to-red-300":
                props.profile.pages_uploaded === props.profile.max_pages,
            }}
          >
            /{props.profile.max_pages}
          </span>
        </div>
      </div>
      <button class="btn btn-primary">Edit Coming Soon 🚀</button>
    </main>
  );
}
