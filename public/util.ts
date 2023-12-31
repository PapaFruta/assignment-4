type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type InputTag = "input" | "textarea" | "json";
type Field = InputTag | { [key: string]: Field };
type Fields = Record<string, Field>;

type operation = {
  name: string;
  endpoint: string;
  method: HttpMethod;
  fields: Fields;
};

const operations: operation[] = [
    {
      name: "Send Kudos",
      endpoint: "/api/kudo",
      method: "POST",
      fields: { receiver: "input", task: "input", message: "input" }
    },
    {
      "name": "Get Kudo For Task",
      "endpoint": "/api/kudo/task/:task",
      "method": "GET",
      "fields": { "task": "input" }
    },
    {
      "name": "Get Received Kudos Of User",
      "endpoint": "/api/kudo/received/:received",
      "method": "GET",
      "fields": { "receiver": "input" }
    },
    {
      "name": "Get Given Kudos Of User",
      "endpoint": "/api/kudo/given/:given",
      "method": "GET",
      "fields": { "giver": "input" }
    },
    {
      "name": "Get Given Kudos Count",
      "endpoint": "/api/kudo/givenCount/:given",
      "method": "GET",
      "fields": { "giver": "input" }
    },
    {
      "name": "Get Received Kudos Count",
      "endpoint": "/api/kudo/receivedCount/:received",
      "method": "GET",
      "fields": { "receiver": "input" }
    },
    {
      name: "Get Session User (logged in user)",
      endpoint: "/api/session",
      method: "GET",
      fields: {},
    },
    {
      name: "Create User",
      endpoint: "/api/users",
      method: "POST",
      fields: { username: "input", password: "input", profilePic: "input", first: "input", last: "input" },
    },
    {
      name: "Login",
      endpoint: "/api/login",
      method: "POST",
      fields: { username: "input", password: "input" },
    },
    {
      name: "Create Tag",
      endpoint: "/api/tag",
      method: "POST",
      fields: { i: "input", n: "input" }
  },
  {
    name: "Attach Item to Tag",
    endpoint: "/api/tag/attach",
    method: "PATCH",
    fields: { tagId: "input", itemId: "input" }
  },
  {
    name: "Get Tag by Name",
    endpoint: "/api/tag/name/:tagName",
    method: "GET",
    fields: { tagName: "input" }
  }
  ,
  {
    name: "Get Tag by ID",
    endpoint: "/api/tag/id/:tagId",
    method: "GET",
    fields: { tagId: "input" }
  }
  ,
  {
    name: "Get Tags by Item ID",
    endpoint: "/api/tag/item/:itemId",
    method: "GET",
    fields: { itemId: "input" }
  }
  ,
  {
    name: "Request Friend",
    endpoint: "/api/friend/request/",
    method: "POST",
    fields: { to: "input", duration: "input" },
  },
  {
    name: "Friend Requests Inbox",
    endpoint: "api/friend/requests",
    method: "GET",
    fields: {},
  },
  {
    name: "Friend List",
    endpoint: "api/friend",
    method: "GET",
    fields: {},
  },
  {
    name: "Delete Friend",
    endpoint: "/api/friend/remove/:friend",
    method: "DELETE",
    fields: { friend: "input" },
  },
  {
    name: "Delete Pending Friend Request",
    endpoint: "/api/friend/requests/:to",
    method: "DELETE",
    fields: { to: "input" },
  },
  {
    name: "Accept Friend Request",
    endpoint: "/api/friend/accept/:from",
    method: "PUT",
    fields: { from: "input" },
  },
  {
    name: "Reject Friend Request",
    endpoint: "/api/friend/reject/:from",
    method: "PUT",
    fields: { from: "input" },
  },
  {
    name: "Delete Expired Friend",
    endpoint: "/api/friend/RemoveExpire",
    method: "DELETE",
    fields: {},
  },
  {
    name: "Create a proposal",
    endpoint: "/api/hangout",
    method: "POST",
    fields: {date: "input", activity: "input", location: "input"},
  },
  {
    name: "Get proposal created",
    endpoint: "/api/hangout/created",
    method: "GET",
    fields: {user:"input"},
  },
  {
    name: "Get proposal accepted",
    endpoint: "/api/hangout/accepted",
    method: "GET",
    fields: {user:"input"},
  },
  {
    name: "Accept Proposal",
    endpoint: "/api/hangout/:id/accept",
    method: "PATCH",
    fields: {id:"input"},
  },
  {
    name: "Suggest Edit to Proposal",
    endpoint: "/api/hangout/:id/suggest",
    method: "PATCH",
    fields: {id:"input",update:{date: "input", activity: "input", location: "input"}},
  },
  {
    name: "Clear all Suggestion",
    endpoint: "/api/hangout/:id/clear",
    method: "PATCH",
    fields: {id:"input"},
  },
  {
    name: "Accept Suggestion",
    endpoint: "/api/hangout/:id/acceptSuggestion",
    method: "PATCH",
    fields: {id:"input",index:"input"},
  },
  {
    name: "Decline Suggestion",
    endpoint: "/api/hangout/:id/declineSuggestion",
    method: "PATCH",
    fields: {id:"input",index:"input"},
  },
  {
    name: "Edit Porposal",
    endpoint: "/api/hangout/:id/edit",
    method: "PATCH",
    fields: {id:"input",update:{date: "input", activity: "input", location: "input"}},
  },
  {
    name: "Delete Proposal",
    endpoint: "/api/hangout",
    method: "DELETE",
    fields: {id:"input"},
  },
  {
    name: "Start Chat with Friend",
    endpoint: "/api/chat",
    method: "POST",
    fields: {to:"input",message:"input"},
  },
  {
    name: "Get Chat with Friend",
    endpoint: "/api/chat",
    method: "GET",
    fields: {to:"input"},
  },
  {
    name: "Send Message",
    endpoint: "/api/chat",
    method: "PATCH",
    fields: {to:"input",message:"input"},
  },
  {
    name: "Create Album",
    endpoint: "/api/chat/album",
    method: "POST",
    fields: {to:"input",title:"input"},
  },
  {
    name: "Get Album",
    endpoint: "/api/chat/album",
    method: "GET",
    fields: {to:"input"},
  },
  {
    name: "Edit Album",
    endpoint: "/api/chat/album/:_id",
    method: "PATCH",
    fields: {_id:"input", update:{title:"input", photos: "json"}},
  },
  {
    name: "Delete Album",
    endpoint: "/api/chat/album/:_id",
    method: "DELETE",
    fields: {_id:"input"},
  },
  
  {
    name: "Logout",
    endpoint: "/api/logout",
    method: "POST",
    fields: {},
  },
  {
    name: "Update User",
    endpoint: "/api/users",
    method: "PATCH",
    fields: { update: { username: "input", password: "input" } },
  },
  {
    name: "Delete User",
    endpoint: "/api/users",
    method: "DELETE",
    fields: {},
  },
  {
    name: "Get Users (empty for all)",
    endpoint: "/api/users/:username",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Get Posts (empty for all)",
    endpoint: "/api/posts",
    method: "GET",
    fields: { author: "input" },
  },
  {
    name: "Create Post",
    endpoint: "/api/posts",
    method: "POST",
    fields: { photos: "json" , caption: "input"},
  },
  {
    name: "Delete Post",
    endpoint: "/api/posts",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Check Authentication Status",
    endpoint: "/api/vertify",
    method: "GET",
    fields: {},
  },
  {
    name: "Vertify with government ID",
    endpoint: "/api/vertify/:id",
    method: "PATCH",
    fields: {id:"input"},
  },
  {
    name: "Get User Profile",
    endpoint: "api/profile",
    method: "GET",
    fields: {}
  },
  {
    name: "Update Profile",
    endpoint: "/api/profile/update",
    method: "PATCH",
    fields: { update: { profilePic: "input", firstname: "input", lastname: "input"} },
  }
];

// Do not edit below here.
// If you are interested in how this works, feel free to ask on forum!

function updateResponse(code: string, response: string) {
  document.querySelector("#status-code")!.innerHTML = code;
  document.querySelector("#response-text")!.innerHTML = response;
}

async function request(method: HttpMethod, endpoint: string, params?: unknown) {
  try {
    if (method === "GET" && params) {
      endpoint += "?" + new URLSearchParams(params as Record<string, string>).toString();
      params = undefined;
    }

    const res = fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: params ? JSON.stringify(params) : undefined,
    });

    return {
      $statusCode: (await res).status,
      $response: await (await res).json(),
    };
  } catch (e) {
    console.log(e);
    return {
      $statusCode: "???",
      $response: { error: "Something went wrong, check your console log.", details: e },
    };
  }
}
function fieldsToHtml(fields: Record<string, Field>, indent = 0, prefix = ""): string {
  return Object.entries(fields)
    .map(([name, tag]) => {
      const htmlTag = tag === "json" ? "textarea" : tag;
      return `
        <div class="field" style="margin-left: ${indent}px">
          <label>${name}:
          ${typeof tag === "string" ? `<${htmlTag} name="${prefix}${name}"></${htmlTag}>` : fieldsToHtml(tag, indent + 10, prefix + name + ".")}
          </label>
        </div>`;
    })
    .join("");
}
function getHtmlOperations() {
  return operations.map((operation) => {
    return `<li class="operation">
      <h3>${operation.name}</h3>
      <form class="operation-form">
        <input type="hidden" name="$endpoint" value="${operation.endpoint}" />
        <input type="hidden" name="$method" value="${operation.method}" />
        ${fieldsToHtml(operation.fields)}
        <button type="submit">Submit</button>
      </form>
    </li>`;
  });
}

function prefixedRecordIntoObject(record: Record<string, string>) {
  const obj: any = {}; // eslint-disable-line
  for (const [key, value] of Object.entries(record)) {
    if (!value) {
      continue;
    }
    const keys = key.split(".");
    const lastKey = keys.pop()!;
    let currentObj = obj;
    for (const key of keys) {
      if (!currentObj[key]) {
        currentObj[key] = {};
      }
      currentObj = currentObj[key];
    }
    currentObj[lastKey] = value;
  }
  return obj;
}

async function submitEventHandler(e: Event) {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const { $method, $endpoint, ...reqData } = Object.fromEntries(new FormData(form));

  // Replace :param with the actual value.
  const endpoint = ($endpoint as string).replace(/:(\w+)/g, (_, key) => {
    const param = reqData[key] as string;
    delete reqData[key];
    return param;
  });

  const op = operations.find((op) => op.endpoint === $endpoint && op.method === $method);
  const pairs = Object.entries(reqData);
  for (const [key, val] of pairs) {
    if (val === "") {
      delete reqData[key];
      continue;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const type = key.split(".").reduce((obj, key) => obj[key], op?.fields as any);
    if (type === "json") {
      reqData[key] = JSON.parse(val as string);
    }
  }

  const data = prefixedRecordIntoObject(reqData as Record<string, string>);

  updateResponse("", "Loading...");
  const response = await request($method as HttpMethod, endpoint as string, Object.keys(data).length > 0 ? data : undefined);
  updateResponse(response.$statusCode.toString(), JSON.stringify(response.$response, null, 2));
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#operations-list")!.innerHTML = getHtmlOperations().join("");
  document.querySelectorAll(".operation-form").forEach((form) => form.addEventListener("submit", submitEventHandler));
});
