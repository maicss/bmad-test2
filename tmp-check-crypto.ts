// Check if crypto.subtle is available
console.log('crypto exists:', typeof crypto !== 'undefined');
console.log('crypto.subtle exists:', typeof crypto?.subtle !== 'undefined');

if (typeof crypto?.subtle !== 'undefined') {
  const encoder = new TextEncoder();
  const data = encoder.encode('test');
  crypto.subtle.digest('SHA-256', data).then(hash => {
    console.log('crypto.subtle.digest works:', hash);
  }).catch(err => {
    console.log('crypto.subtle.digest failed:', err);
  });
}
