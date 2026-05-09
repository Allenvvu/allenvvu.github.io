const OWNER = 'Allenvvu';
const REPO = 'allenvvu.github.io';
const FILE_PATH = 'data/default-layout.json';

export async function publishLayout(layout, token) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };

  let sha;
  try {
    const getRes = await fetch(url, { headers });
    if (!getRes.ok) {
      const body = await getRes.json();
      return { ok: false, error: body.message || `GET failed: ${getRes.status}` };
    }
    sha = (await getRes.json()).sha;
  } catch (e) {
    return { ok: false, error: `NetworkError: ${e.message}` };
  }

  const content = btoa(unescape(encodeURIComponent(JSON.stringify(layout, null, 2))));
  try {
    const putRes = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ message: 'data: publish layout via admin', content, sha }),
    });
    if (!putRes.ok) {
      const body = await putRes.json();
      return { ok: false, error: body.message || `PUT failed: ${putRes.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `NetworkError: ${e.message}` };
  }
}
