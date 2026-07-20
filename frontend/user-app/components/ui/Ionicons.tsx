import React from 'react';
import { Octicons } from '@expo/vector-icons';

// Complete set of valid Octicons glyph names.
const VALID_OCTICONS = new Set([
  'accessibility','accessibility-inset','ai-model','alert','alert-fill','apps','archive',
  'arrow-both','arrow-down','arrow-down-left','arrow-down-right','arrow-left','arrow-right',
  'arrow-switch','arrow-up','arrow-up-left','arrow-up-right','beaker','bell','bell-fill',
  'bell-slash','blocked','bold','book','bookmark','bookmark-filled','bookmark-slash',
  'bookmark-slash-fill','briefcase','broadcast','browser','bug','cache','calendar','check',
  'check-circle','check-circle-fill','checkbox','checklist','chevron-down','chevron-left',
  'chevron-right','chevron-up','circle','circle-slash','clock','clock-fill','cloud',
  'cloud-offline','code','code-of-conduct','code-review','code-square','codescan',
  'codescan-checkmark','codespaces','columns','command-palette','comment','comment-discussion',
  'container','copilot','copilot-error','copilot-warning','copy','cpu','credit-card',
  'cross-reference','dash','database','dependabot','desktop-download','device-camera',
  'device-camera-video','device-desktop','device-mobile','devices','diamond','diff',
  'diff-added','diff-ignored','diff-modified','diff-removed','diff-renamed',
  'discussion-closed','discussion-duplicate','discussion-outdated','dot','dot-fill',
  'download','duplicate','ellipsis','eye','eye-closed','feed-discussion','feed-forked',
  'feed-heart','feed-issue-closed','feed-issue-draft','feed-issue-open','feed-issue-reopen',
  'feed-merged','feed-person','feed-plus','feed-public','feed-pull-request-closed',
  'feed-pull-request-draft','feed-pull-request-open','feed-repo','feed-rocket','feed-star',
  'feed-tag','feed-trophy','file','file-added','file-badge','file-binary','file-code',
  'file-diff','file-directory','file-directory-fill','file-directory-open-fill',
  'file-directory-symlink','file-media','file-moved','file-removed','file-submodule',
  'file-symlink-file','file-zip','filter','filter-remove','fiscal-host','flame','fold',
  'fold-down','fold-up','gear','gift','git-branch','git-commit','git-compare','git-merge',
  'git-merge-queue','git-pull-request','git-pull-request-closed','git-pull-request-draft',
  'globe','goal','grabber','graph','hash','heading','heart','heart-fill','history','home',
  'home-fill','horizontal-rule','hourglass','hubot','id-badge','image','inbox','infinity',
  'info','issue-closed','issue-draft','issue-opened','issue-reopened','issue-tracked-by',
  'issue-tracks','italic','iterations','kebab-horizontal','key','key-asterisk','law',
  'light-bulb','link','link-external','list-ordered','list-unordered','location','lock',
  'log','logo-gist','logo-github','mail','mark-github','markdown','megaphone','mention',
  'meter','milestone','mirror','moon','mortar-board','move-to-bottom','move-to-end',
  'move-to-start','move-to-top','multi-select','mute','no-entry','north-star','note',
  'number','organization','package','package-dependencies','package-dependents',
  'paintbrush','paper-airplane','paperclip','passkey-fill','paste','pause','pencil',
  'people','person','person-add','person-fill','pin','pin-slash','pivot-column','play',
  'plug','plus','plus-circle','project','project-roadmap','project-symlink',
  'project-template','pulse','question','quote','read','redo','rel-file-path','reply',
  'repo','repo-clone','repo-deleted','repo-forked','repo-locked','repo-pull','repo-push',
  'repo-template','report','rocket','rows','rss','ruby','screen-full','screen-normal',
  'search','server','share','share-android','shield','shield-check','shield-lock',
  'shield-slash','shield-x','sidebar-collapse','sidebar-expand','sign-in','sign-out',
  'single-select','skip','skip-fill','sliders','smiley','sort-asc','sort-desc','sparkle',
  'sparkle-fill','sparkles-fill','sponsor-tiers','square','square-circle','square-fill',
  'squirrel','stack','star','star-fill','stop','stopwatch','strikethrough','sun','sync',
  'tab','tab-external','table','tag','tasklist','telescope','telescope-fill','terminal',
  'three-bars','thumbsdown','thumbsup','tools','tracked-by-closed-completed',
  'tracked-by-closed-not-planned','trash','triangle-down','triangle-left','triangle-right',
  'triangle-up','trophy','typography','undo','unfold','unlink','unlock','unmute','unread',
  'unverified','upload','verified','versions','video','webhook','workflow','x','x-circle',
  'x-circle-fill','zap','zoom-in','zoom-out',
]);

// Mapping from Ionicons name → Octicons name
const iconMap: Record<string, string> = {
  // ── Navigation / Arrows ──
  'arrow-back': 'arrow-left',
  'arrow-back-outline': 'arrow-left',
  'arrow-forward': 'arrow-right',
  'arrow-forward-outline': 'arrow-right',
  'chevron-back': 'chevron-left',
  'chevron-forward': 'chevron-right',
  'chevron-down': 'chevron-down',
  'chevron-up': 'chevron-up',
  'chevron-right': 'chevron-right',
  'chevron-left': 'chevron-left',
  'navigate': 'paper-airplane',
  'navigate-outline': 'paper-airplane',
  'swap-horizontal-outline': 'arrow-switch',

  // ── Actions / UI controls ──
  'add': 'plus',
  'add-circle-outline': 'plus-circle',
  'remove': 'dash',
  'close': 'x',
  'close-circle': 'x-circle',
  'close-circle-outline': 'x-circle',
  'trash': 'trash',
  'trash-outline': 'trash',
  'create-outline': 'pencil',
  'refresh': 'sync',
  'refresh-circle-outline': 'sync',
  'refresh-outline': 'sync',
  'options-outline': 'sliders',
  'copy': 'copy',
  'copy-outline': 'copy',
  'share-social-outline': 'share',
  'sparkles': 'sparkles-fill',
  'flag-outline': 'bookmark',

  // ── Checkmarks ──
  'checkmark': 'check',
  'checkmark-outline': 'check',
  'checkmark-circle': 'check-circle',
  'checkmark-circle-outline': 'check-circle',
  'checkmark-circle-fill': 'check-circle-fill',
  'checkmark-done': 'check',
  'checkmark-done-outline': 'check',

  // ── Common Objects / Symbols ──
  'search': 'search',
  'search-outline': 'search',
  'heart': 'heart-fill',
  'heart-outline': 'heart',
  'heart-dislike-outline': 'heart',
  'star': 'star-fill',
  'star-outline': 'star',
  'bell': 'bell-fill',
  'bell-outline': 'bell',
  'bell-slash': 'bell-slash',
  'notifications-outline': 'bell',
  'notifications-off-outline': 'bell-slash',
  'location': 'location',
  'location-outline': 'location',
  'lock-closed': 'lock',
  'lock-closed-outline': 'lock',
  'key-outline': 'key',
  'mail-outline': 'mail',
  'phone-portrait-outline': 'device-mobile',
  'call': 'device-mobile',
  'call-outline': 'device-mobile',
  'camera': 'device-camera',
  'time': 'clock-fill',
  'time-outline': 'clock',
  'timer-outline': 'stopwatch',
  'calendar-outline': 'calendar',
  'clock': 'clock-fill',
  'clock-outline': 'clock',
  'eye': 'eye',
  'eye-outline': 'eye',
  'eye-off': 'eye-closed',
  'eye-off-outline': 'eye-closed',
  'pricetag': 'tag',
  'pricetag-outline': 'tag',

  // ── Home / Tabs ──
  'home': 'home-fill',
  'home-outline': 'home',

  // ── Send / Communication ──
  'send': 'paper-airplane',
  'send-outline': 'paper-airplane',
  'chatbubble-ellipses': 'comment-discussion',
  'chatbubble-ellipses-outline': 'comment-discussion',
  'chatbubbles': 'comment-discussion',
  'chatbubbles-outline': 'comment-discussion',
  'chatbubble-outline': 'comment',
  'chatbubble': 'comment',
  'logo-whatsapp': 'comment',
  'megaphone-outline': 'megaphone',

  // ── Business / Domain-specific ──
  'bag-handle': 'briefcase',
  'bag-handle-outline': 'briefcase',
  'bicycle': 'rocket',
  'bicycle-outline': 'rocket',
  'cart': 'package',
  'cart-outline': 'package',
  'cash-outline': 'credit-card',
  'card-outline': 'credit-card',
  'wallet': 'credit-card',
  'wallet-outline': 'credit-card',
  'receipt': 'tasklist',
  'receipt-outline': 'tasklist',
  'list': 'tasklist',
  'list-outline': 'tasklist',
  'storefront': 'home-fill',
  'storefront-outline': 'home',
  'apps': 'apps',
  'restaurant': 'package',
  'restaurant-outline': 'package',
  'fast-food-outline': 'package',

  // ── Warnings / Info ──
  'alert-circle': 'alert',
  'alert-circle-outline': 'alert',
  'warning': 'alert',
  'warning-outline': 'alert',
  'info': 'info',
  'information-circle': 'info',
  'information-circle-outline': 'info',
  'help-circle': 'question',
  'help-circle-outline': 'question',
  'shield-checkmark': 'shield-check',
  'shield-checkmark-outline': 'shield-check',
  'cloud-download': 'download',
  'cloud-download-outline': 'download',
  'cloud-offline-outline': 'cloud-offline',
  'wifi-outline': 'broadcast',

  // ── User profile ──
  'person': 'person-fill',
  'person-outline': 'person',
  'person-circle': 'person-fill',
  'person-circle-outline': 'person',
  'person-add-outline': 'person-add',
  'log-out-outline': 'sign-out',
  'ribbon-outline': 'trophy',
  'globe': 'globe',
  'globe-outline': 'globe',
  'language-outline': 'globe',

  // ── Others ──
  'flame': 'flame',
  'flash': 'zap',
  'flash-outline': 'zap',
  'headset': 'people',
  'headset-outline': 'people',
  'calculator-outline': 'number',
  'hourglass-outline': 'hourglass',
  'hourglass': 'hourglass',
};

const DEFAULT_ICON = 'dot';

interface IoniconsProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
  [key: string]: any;
}

export function Ionicons({ name, size = 24, color, style, ...props }: IoniconsProps) {
  // 1. Try the explicit mapping
  let resolved = iconMap[name];

  // 2. If not mapped, use name directly (might already be a valid Octicons name)
  if (!resolved) {
    resolved = name;
  }

  // 3. If the resolved name is not a valid Octicons glyph, use a neutral default.
  if (!VALID_OCTICONS.has(resolved)) {
    resolved = DEFAULT_ICON;
  }

  return (
    <Octicons
      name={resolved as any}
      size={size}
      color={color}
      style={style}
      {...props}
    />
  );
}
