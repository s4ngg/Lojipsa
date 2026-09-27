// 로스트아크 공식 사이트(lostark.game.onstove.com)에서 실제로 서빙하는 직업 엠블럼 이미지.
// 캐릭터 프로필 페이지(전투정보실)에 캐릭터명 옆에 표시되는 것과 동일한 공식 아이콘이다.
// 임의로 만든 아이콘이 아니라 Smilegate CDN에 실제 존재하는 파일만 매핑했다 — 확인 안 된 일부 직업은
// 의도적으로 제외했고, 그 경우 호출부에서 폴백(캐릭터 초상화 등) 처리한다.
const CLASS_EMBLEM_SLUG: Record<string, string> = {
  디스트로이어: 'destroyer',
  워로드: 'warlord',
  버서커: 'berserker',
  홀리나이트: 'holyknight',
  발키리: 'holyknight_female',
  브레이커: 'infighter_male',
  인파이터: 'infighter',
  배틀마스터: 'battle_master',
  창술사: 'lance_master',
  데빌헌터: 'devil_hunter',
  블래스터: 'blaster',
  호크아이: 'hawkeye',
  스카우터: 'scouter',
  건슬링어: 'gunslinger',
  바드: 'bard',
  서머너: 'summoner',
  아르카나: 'arcana',
  블레이드: 'blade',
  데모닉: 'demonic',
  리퍼: 'reaper',
  소울이터: 'soul_eater',
  도화가: 'yinyangshi',
  기상술사: 'weather_artist',
  환수사: 'alchemist',
  차원술사: 'dimension_master',
  가디언나이트: 'dragon_knight',
}

export function getClassEmblemUrl(characterClassName: string): string | null {
  const slug = CLASS_EMBLEM_SLUG[characterClassName]
  if (!slug) return null
  return `https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/emblem_${slug}.png`
}
