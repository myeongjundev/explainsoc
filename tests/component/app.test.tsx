import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../../src/app/App'
import { PAPER } from '../../src/data/paperEvidence'
import { MESSAGES } from '../../src/domain/validation'

function setup() {
  const user = userEvent.setup()
  render(<App />)
  return { user }
}

describe('첫 화면 (BRB-C03)', () => {
  it('제목, 도움 한 문장, 축약하지 않은 논문 제목, 개인정보 안내가 있다', () => {
    setup()
    expect(screen.getByRole('heading', { level: 1, name: '보안 AI의 99점, 처음 보는 공격에서도 99점일까요?' })).toBeInTheDocument()
    expect(document.querySelector('.hero__help')).toHaveTextContent('연습문제를 그대로 낸 시험')
    expect(screen.getByText(/회사에서 보안 AI 제품 자료를 받았을 때 씁니다/)).toBeInTheDocument()
    expect(screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === `반영한 논문 · ${PAPER.title}`)).toBeInTheDocument()
    expect(screen.getByText(/입력한 성능 자료는 브라우저 메모리에서만 계산됩니다/)).toBeInTheDocument()
    expect(screen.getByText(/숫자를 준비하지 않아도 됩니다/)).toBeInTheDocument()
    expect(screen.getByText('검토 파일 열기')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '예시로 바로 보기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '숫자로 직접 입력' })).toBeInTheDocument()
  })

  it('논문 링크는 새 탭으로 열고, 외부 링크라는 것을 이름에 담는다', () => {
    setup()
    const repo = screen.getAllByRole('link', { name: /논문 저장소/ })[0]
    expect(repo).toHaveAttribute('href', PAPER.repoUrl)
    expect(repo).toHaveAttribute('target', '_blank')
    expect(repo).toHaveAttribute('rel', 'noopener noreferrer')
    expect(repo).toHaveAccessibleName('논문 저장소 (외부 링크, 새 탭)')
  })

  it('첫 화면에는 입력 폼과 긴 연구 한계가 아직 없다', () => {
    setup()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByText(/연구 범위와 근거/)).not.toBeInTheDocument()
  })
})

describe('예시로 바로 보기', () => {
  it('결과로 바로 가서 R04와 그 질문을 보여 준다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '예시로 바로 보기' }))
    expect(screen.getByRole('heading', { level: 2, name: '3. 검토 결과' })).toHaveFocus()
    expect(screen.getByText(/R04/)).toBeInTheDocument()
    const questions = screen.getByRole('region', { name: '공급자에게 물을 질문' })
    expect(within(questions).getByText('같은 시험에서 공격 Recall은 얼마입니까?')).toHaveClass('question-card__text')
    expect(document.querySelector('.baseline__delta')).toHaveTextContent('74건(탐지 160 − 오탐 86)')
  })

  it('긴 판독 목록보다 먼저 현재 회차와 첫 질문을 한눈에 요약한다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '예시로 바로 보기' }))
    const briefing = screen.getByRole('region', { name: '1개의 해석 주의를 먼저 읽어야 합니다' })
    expect(within(briefing).getByText('논문 예시 검토')).toBeInTheDocument()
    expect(within(briefing).getByText('같은 시험에서 공격 Recall은 얼마입니까?')).toBeInTheDocument()
    expect(within(briefing).getByRole('button', { name: '질문과 답변으로 이동' })).toBeInTheDocument()
  })

  it('정확한 P09 원수치와 두 주장 지표를 넣는다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '예시로 바로 보기' }))
    await user.click(screen.getByRole('button', { name: '입력 수정' }))
    expect(screen.getByLabelText(/정상→정상 \(TN\)/)).toHaveValue('375432')
    expect(screen.getByLabelText(/정상→공격, 오탐 \(FP\)/)).toHaveValue('86')
    expect(screen.getByLabelText(/공격→정상, 미탐 \(FN\)/)).toHaveValue('220628')
    expect(screen.getByLabelText(/공격→공격 \(TP\)/)).toHaveValue('160')
    expect(screen.getByLabelText('지표 1')).toHaveValue('accuracy')
    expect(screen.getAllByLabelText('값 (0부터 1 사이)')[0]).toHaveValue('0.6299')
    expect(screen.getByLabelText('지표 2')).toHaveValue('fpr')
    expect(screen.getAllByLabelText('값 (0부터 1 사이)')[1]).toHaveValue('0.0002')
  })

  it('뒤집으면 공격 개수가 보이고, 스크린 리더에도 알린다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '예시로 바로 보기' }))
    const flip = screen.getByRole('button', { name: '공격 기준으로 뒤집기' })
    expect(flip).toHaveAttribute('aria-pressed', 'false')
    await user.click(flip)
    expect(screen.getByRole('button', { name: '받은 주장 다시 보기' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('공격 220,788건 가운데 탐지 160건 · 미탐 220,628건')).toBeInTheDocument()
  })
})

describe('입력 검증 (BRB-C05)', () => {
  it('지표를 고르기 전에는 숫자 칸을 열지 않는다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '숫자로 직접 입력' }))
    expect(screen.getByLabelText('값 (0부터 1 사이)')).toBeDisabled()
    expect(screen.getByText(MESSAGES.metricKindMissing)).toBeInTheDocument()
  })

  it('오류는 보이는 label의 칸에 연결되고 무엇을 고칠지 말한다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '숫자로 직접 입력' }))
    await user.selectOptions(screen.getByLabelText('지표 1'), 'accuracy')
    const value = screen.getByLabelText('값 (0부터 1 사이)')
    await user.type(value, '99')
    expect(value).toHaveAttribute('aria-invalid', 'true')
    expect(value).toHaveAccessibleDescription(MESSAGES.ratioAboveOne)
  })

  it('잘못된 입력 하나가 다른 유효한 입력의 결과를 막지 않는다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '숫자로 직접 입력' }))
    await user.selectOptions(screen.getByLabelText('지표 1'), 'accuracy')
    await user.type(screen.getByLabelText('값 (0부터 1 사이)'), 'abc')
    await user.click(screen.getByRole('button', { name: '+ 지표 하나 더' }))
    await user.selectOptions(screen.getByLabelText('지표 2'), 'fpr')
    await user.type(screen.getAllByLabelText('값 (0부터 1 사이)')[1], '0.001')
    await user.click(screen.getByRole('button', { name: /검토 결과/ }))
    expect(screen.getByText(/R04/)).toBeInTheDocument()
    expect(screen.queryByText(/R03/)).not.toBeInTheDocument()
    expect(screen.getByText('잘못 적은 칸 1개는 계산에서 뺐습니다. 입력 수정에서 고칠 수 있습니다.')).toBeInTheDocument()
  })

  it('혼동행렬의 합이 0이면 계산하지 않고 이유를 말한다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '숫자로 직접 입력' }))
    await user.click(screen.getByRole('button', { name: '질문 전체 한 번에 보기' }))
    await user.click(screen.getByRole('button', { name: '혼동행렬로 입력' }))
    for (const label of [/\(TN\)/, /\(FP\)/, /\(FN\)/, /\(TP\)/]) await user.type(screen.getByLabelText(label), '0')
    expect(screen.getByText(MESSAGES.matrixEmpty)).toBeInTheDocument()
  })

  it('혼동행렬에 음수나 글자를 넣으면 그 칸에만 오류를 보인다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '숫자로 직접 입력' }))
    await user.click(screen.getByRole('button', { name: '질문 전체 한 번에 보기' }))
    await user.click(screen.getByRole('button', { name: '혼동행렬로 입력' }))
    await user.type(screen.getByLabelText(/\(TN\)/), '-5')
    await user.type(screen.getByLabelText(/\(FP\)/), 'abc')
    expect(screen.getByLabelText(/\(TN\)/)).toHaveAccessibleDescription(MESSAGES.countInvalid)
    expect(screen.getByLabelText(/\(FP\)/)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText(/\(TP\)/)).not.toHaveAttribute('aria-invalid')
  })
})

describe('평가 조건 세 질문', () => {
  it('예 / 아니오 / 모름을 기본 라디오와 보이는 legend로 묻는다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '숫자로 직접 입력' }))
    await user.click(screen.getByRole('button', { name: /평가 조건/ }))
    await user.click(screen.getByRole('button', { name: '건너뛰고 다음' }))
    const group = screen.getByRole('group', { name: '시험에 학습 때 없던 공격이 들어 있었나요?' })
    const radios = within(group).getAllByRole('radio')
    expect(radios.map((r) => (r as HTMLInputElement).value)).toEqual(['yes', 'no', 'unknown'])
    await user.click(within(group).getByLabelText(/모름/))
    expect(within(group).getByLabelText(/모름/)).toBeChecked()
  })

  it('아무것도 고르지 않고 결과로 가도 질문 세 개가 나온다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '숫자로 직접 입력' }))
    await user.click(screen.getByRole('button', { name: /검토 결과/ }))
    const questions = screen.getByRole('region', { name: '공급자에게 물을 질문' })
    expect(within(questions).getAllByRole('listitem')).toHaveLength(3)
  })
})

describe('입력 방식 — 처음은 한 화면씩, 고칠 때는 한 장', () => {
  it('처음 입력은 질문 하나씩 묻고, 다음을 누르면 초점이 새 질문으로 간다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '숫자로 직접 입력' }))
    expect(screen.getByText('제품 자료에 적힌 성능 숫자를 적어 주세요')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: /시험 자료는 어떻게 나눴나요/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '건너뛰고 다음' }))
    expect(screen.getByText('공급자가 이 모델을 “가장 좋은 모델”이라고 소개했나요?')).toHaveFocus()
  })

  it('결과에서 입력 수정을 누르면 여섯 질문을 한 장에 보인다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '예시로 바로 보기' }))
    await user.click(screen.getByRole('button', { name: '입력 수정' }))
    expect(screen.getByRole('heading', { level: 2, name: '받은 숫자와 평가 조건을 적어 주세요' })).toHaveFocus()
    expect(screen.getByRole('group', { name: /시험 자료는 어떻게 나눴나요/ })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /중복된 기록과/ })).toBeInTheDocument()
  })
})

describe('근거 확인표 — V8에서 옛 평가 근거 지도를 합침', () => {
  it('결과 1장에는 근거 패널이 하나만 있고, 평가 조건으로 돌아가는 단추를 품는다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '예시로 바로 보기' }))
    const board = screen.getByRole('region', { name: '주장을 읽는 데 필요한 근거' })
    expect(within(board).getAllByRole('listitem')).toHaveLength(6)
    expect(board).toHaveTextContent('모름은 실패가 아니라 공급자에게 물을 질문이 됩니다.')
    expect(screen.queryByText('어떤 근거까지 가지고 있습니까?')).not.toBeInTheDocument()
    // 평가 조건 구역으로 스크롤한다. jsdom에는 scrollIntoView가 없어 이 시험에서만 채운다.
    const scroll = vi.fn()
    Element.prototype.scrollIntoView = scroll
    await user.click(within(board).getByRole('button', { name: '평가 조건 확인' }))
    expect(screen.getByRole('heading', { level: 2, name: '받은 숫자와 평가 조건을 적어 주세요' })).toBeInTheDocument()
    expect(scroll).toHaveBeenCalled()
    delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView
  })

  it('분할과 미관측 공격의 답이 어긋나면 표 안에서 R12 안내를 보인다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '숫자로 직접 입력' }))
    await user.click(screen.getByRole('button', { name: '질문 전체 한 번에 보기' }))
    await user.click(within(screen.getByRole('group', { name: /시험 자료는 어떻게 나눴나요/ })).getByLabelText(/학습에 없던 공격을 따로 시험/))
    await user.click(within(screen.getByRole('group', { name: /시험에 학습 때 없던 공격이 들어 있었나요/ })).getByLabelText(/아니오/))
    await user.click(screen.getByRole('button', { name: '결과 보기' }))
    const board = screen.getByRole('region', { name: '주장을 읽는 데 필요한 근거' })
    expect(within(board).getByRole('status')).toHaveTextContent('시험 설계의 두 답이 서로 다르게 읽힙니다.')
    expect(board.querySelectorAll('.evidence-status__item--alert')).toHaveLength(2)
  })
})

describe('소개서 문장으로 검토 (V9)', () => {
  it('첫 화면에서 소개서 판독을 열고, 비어 있을 때는 붙여 넣을 자리와 예시를 안내한다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '소개서 문장 붙여 넣기' }))
    expect(screen.getByRole('heading', { level: 2, name: '받은 소개서 문장을 붙여 넣어 주세요' })).toHaveFocus()
    expect(screen.getByLabelText('받은 소개서·제안서 문장')).toHaveValue('')
    expect(screen.getByText(/붙여 넣은 글은 이 브라우저 메모리에서만 읽습니다/)).toBeInTheDocument()
    expect(screen.queryByRole('article', { name: '표시를 붙인 소개서' })).not.toBeInTheDocument()
  })

  it('예시 소개서의 여섯 표시마다 논문 근거와 질문을 붙이고, 없는 조건은 따로 모은다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '소개서 문장 붙여 넣기' }))
    await user.click(screen.getAllByRole('button', { name: '가상의 예시 소개서 넣기' })[0])
    const sheet = screen.getByRole('article', { name: '표시를 붙인 소개서' })
    expect(sheet.querySelectorAll('mark')).toHaveLength(6)
    const notes = within(screen.getByRole('list', { name: '표시별 판독' })).getAllByRole('listitem').filter((li) => li.classList.contains('reader-note'))
    expect(notes).toHaveLength(6)
    expect(notes[5]).toHaveTextContent('설명 가능 AI 주장')
    expect(notes[5]).toHaveTextContent('Jaccard 1.0000')
    expect(notes[3]).toHaveTextContent('새 공격 탐지 주장')
    expect(notes[3]).toHaveTextContent('0.9979에서 0.3871로')
    expect(within(screen.getByRole('region', { name: '소개서에 없어 질문이 된 것' })).getByText('중복과 학습·시험 사이 같은 행을 검사했습니까?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '결과 보기 · 질문 7개' })).toBeInTheDocument()
  })

  it('판독할 표현이 없으면 없다고 말하고, 모든 조건을 질문으로 남긴다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '소개서 문장 붙여 넣기' }))
    await user.type(screen.getByLabelText('받은 소개서·제안서 문장'), '보안 운영을 쉽게 만듭니다.')
    expect(screen.getByText(/판독할 표현을 찾지 못했습니다/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /결과 보기 · 질문/ }))
    const questions = screen.getByRole('region', { name: '공급자에게 물을 질문' })
    expect(within(questions).getAllByRole('listitem')).toHaveLength(3)
  })
})

describe('결론 카드 (V9)', () => {
  it('결과 맨 위에서 결론·왜·그래서를 쉬운 말로 먼저 말하고, 판정이 아니라고 밝힌다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '예시로 바로 보기' }))
    const card = screen.getByRole('region', { name: /처음 보는 공격으로 시험한 숫자가 있습니다/ })
    expect(card).toHaveTextContent('100건으로 치면 약 0.07건')
    expect(card).toHaveTextContent('판매 업체에 아래 질문 1개를 하세요')
    expect(card).toHaveTextContent('AI 제품이 좋다·나쁘다는 판정이 아닙니다')
    await user.click(within(card).getByRole('button', { name: '업체에 물을 질문 보기' }))
    expect(screen.getByRole('region', { name: '공급자에게 물을 질문' })).toBeVisible()
  })
})

describe('논문 실험실 (V9)', () => {
  it('첫 화면에서 열고, 시험을 바꾸면 Macro F1 1위가 XGBoost에서 Logistic Regression으로 바뀐다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /논문 실험실/ }))
    expect(screen.getByRole('heading', { level: 2, name: '광고 숫자 뒤에 있던 실험을 직접 바꿔 보세요' })).toHaveFocus()
    const rank = () => within(screen.getByRole('list', { name: /순위$/ })).getAllByRole('listitem').map((li) => li.querySelector('.rank__model')?.textContent)
    expect(rank()).toEqual(['XGBoost', 'Random Forest', 'Logistic Regression'])
    await user.click(within(screen.getByRole('group', { name: '시험' })).getByLabelText(/처음 보는 공격 유형으로 시험/))
    expect(rank()).toEqual(['Logistic Regression', 'Random Forest', 'XGBoost'])
    expect(screen.getByText(/다른 시험에서 1위였던 모델은 XGBoost입니다/)).toBeInTheDocument()
  })

  it('상위 특징을 지운 수를 바꾸면 두 모델의 예측 변화가 함께 바뀐다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /논문 실험실/ }))
    const slider = screen.getByLabelText(/지운 상위 특징 수/)
    expect(screen.getByText(/예측 35.5%가 바뀌었고/)).toBeInTheDocument()
    fireEvent.change(slider, { target: { value: '3' } })
    expect(screen.getByText(/상위 3개를 지우자/)).toHaveTextContent('예측 17.3%가 바뀌었고')
    expect(screen.getByText(/상위 3개를 지우자/)).toHaveTextContent('0.15%만 바뀌었습니다')
    await user.click(screen.getByRole('button', { name: '첫 화면으로' }))
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})

describe('실험실로 바로 가기 (V9)', () => {
  it('소개서의 설명 주장 메모에서 실험 4로 바로 가고, 돌아오면 소개서가 그대로다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '소개서 문장 붙여 넣기' }))
    await user.click(screen.getAllByRole('button', { name: '가상의 예시 소개서 넣기' })[0])
    const notes = within(screen.getByRole('list', { name: '표시별 판독' })).getAllByRole('listitem').filter((li) => li.classList.contains('reader-note'))
    await user.click(within(notes[5]).getByRole('button', { name: /논문 실험실에서 직접 보기/ }))
    expect(screen.getByRole('heading', { level: 3, name: '설명이 안정적이라고, 공격을 잘 잡는 것은 아닙니다' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: '소개서 판독으로 돌아가기' }))
    expect((screen.getByLabelText('받은 소개서·제안서 문장') as HTMLTextAreaElement).value).toContain('SHAP 설명')
  })

  it('결론 카드에서 최고 성능·설명 주장에 맞는 실험으로 가는 길을 보인다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '소개서 문장 붙여 넣기' }))
    await user.click(screen.getAllByRole('button', { name: '가상의 예시 소개서 넣기' })[0])
    await user.click(screen.getByRole('button', { name: /결과 보기 · 질문/ }))
    const links = screen.getByRole('list', { name: '논문 실험실에서 직접 보기' })
    expect(within(links).getAllByRole('button').map((b) => b.textContent)).toEqual([
      expect.stringContaining('실험 1'),
      expect.stringContaining('실험 4'),
    ])
    await user.click(within(links).getAllByRole('button')[0])
    expect(screen.getByRole('heading', { level: 3, name: '1위는 시험이 정합니다' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: '검토 결과로 돌아가기' }))
    expect(screen.getByRole('heading', { level: 2, name: '3. 검토 결과' })).toHaveFocus()
  })
})

describe('질문 복사', () => {
  it('질문 문장만 복사하고 입력한 숫자는 담지 않는다', async () => {
    const { user } = setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    await user.click(screen.getByRole('button', { name: '숫자로 직접 입력' }))
    await user.selectOptions(screen.getByLabelText('지표 1'), 'accuracy')
    await user.type(screen.getByLabelText('값 (0부터 1 사이)'), '0.8765')
    await user.click(screen.getByRole('button', { name: /검토 결과/ }))
    await user.click(screen.getByRole('button', { name: '질문만 복사' }))
    expect(writeText).toHaveBeenCalledTimes(1)
    const text = writeText.mock.calls[0][0]
    expect(text).not.toContain('0.8765')
    expect(text.split('\n')).toHaveLength(4)
    expect(await screen.findByText('질문 4개를 복사했습니다. 입력한 숫자는 담지 않았습니다.')).toBeInTheDocument()
  })

  it('복사할 수 없으면 목록을 선택해 두고 직접 복사하라고 알린다', async () => {
    const { user } = setup()
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'))
    await user.click(screen.getByRole('button', { name: '예시로 바로 보기' }))
    await user.click(screen.getByRole('button', { name: '질문만 복사' }))
    expect(await screen.findByText('복사하지 못했습니다. 질문 목록을 선택해 두었으니 직접 복사해 주세요.')).toBeInTheDocument()
  })
})

describe('PoC 미팅 산출물', () => {
  it('질문 상태와 메모를 검토표에 포함해 복사한다', async () => {
    const { user } = setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    await user.click(screen.getByRole('button', { name: '예시로 바로 보기' }))
    await user.selectOptions(screen.getByLabelText('답변 상태'), 'requested')
    await user.type(screen.getByLabelText('답변 메모'), '공격 유형별 Recall 표를 요청함')
    await user.click(screen.getByRole('button', { name: '검토표 전체 복사' }))

    const copied = writeText.mock.calls.at(-1)?.[0] ?? ''
    expect(copied).toContain('상태: 자료 요청')
    expect(copied).toContain('메모: 공격 유형별 Recall 표를 요청함')
    expect(copied).toContain('요청할 자료: 같은 시험의 공격 Recall과 공격 표본 수')
    expect(copied).toContain('[회차 기록]')
    expect(copied).toContain('논문 예시 검토')
    expect(copied).toContain('최초 제안서 · 같은 시험: 해당 없음')
    expect(copied).toContain('모델의 합격·불합격이나 실제 조직망 성능을 판정하지 않습니다')
    expect(await screen.findByText(/PoC 검토표 전체를 복사했습니다/)).toBeInTheDocument()
  })

  it('혼동행렬을 열고 닫아도 예시 출처를 보존한다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '예시로 바로 보기' }))
    await user.click(screen.getByRole('button', { name: '입력 수정' }))
    await user.click(screen.getByRole('button', { name: '혼동행렬 닫기' }))
    await user.click(screen.getByRole('button', { name: '혼동행렬로 입력' }))
    await user.click(screen.getByRole('button', { name: /검토 결과/ }))
    expect(document.querySelector('.reveal__scope')).toHaveTextContent('CICIDS2017')
    expect(document.querySelector('.step-source')).toHaveTextContent('논문 예시 A')
  })

  it('계속 남은 질문은 직전 상태·메모를 이어받되 이전 회차 기록은 바꾸지 않는다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '예시로 바로 보기' }))
    await user.selectOptions(screen.getByLabelText('답변 상태'), 'requested')
    await user.type(screen.getByLabelText('답변 메모'), '1회차 요청 메모')
    await user.click(screen.getByText('회차 기록과 다음 답변 관리'))
    await user.click(screen.getByRole('button', { name: '현재 회차 저장 · 다음 답변 추가' }))
    await user.click(screen.getByRole('button', { name: /검토 결과/ }))

    expect(screen.getByLabelText('답변 상태')).toHaveValue('requested')
    expect(screen.getByLabelText('답변 메모')).toHaveValue('1회차 요청 메모')
    await user.selectOptions(screen.getByLabelText('답변 상태'), 'answered')
    await user.clear(screen.getByLabelText('답변 메모'))
    await user.type(screen.getByLabelText('답변 메모'), '2회차 답변 메모')

    const brief = screen.getByLabelText('PoC 검토표 미리보기')
    expect(brief).toHaveTextContent('당시 상태: 자료 요청')
    expect(brief).toHaveTextContent('당시 메모: 1회차 요청 메모')
    expect(brief).toHaveTextContent('상태: 답변 받음')
    expect(brief).toHaveTextContent('메모: 2회차 답변 메모')
  })
})

describe('결과를 한 장씩 읽는 흐름 (V7)', () => {
  it('처음에는 1 / 3 주장과 근거에서 시작하고, 아래 단추로 다음 장을 연다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '예시로 바로 보기' }))
    const pager = screen.getByRole('navigation', { name: '검토 단계 이동' })
    expect(within(pager).getByText('1 / 3 · 주장과 근거')).toBeInTheDocument()
    expect(document.querySelector('.board-column.is-active .board-column__head h3')).toHaveTextContent('주장과 근거')

    await user.click(within(pager).getByRole('button', { name: '다음: 판독' }))
    expect(within(pager).getByText('2 / 3 · 판독')).toBeInTheDocument()
    expect(document.querySelector('.board-column.is-active .board-column__head h3')).toHaveTextContent('판독')

    await user.click(within(pager).getByRole('button', { name: '다음: 다음 행동' }))
    expect(within(pager).getByText('3 / 3 · 다음 행동')).toBeInTheDocument()
    expect(within(pager).queryByRole('button', { name: /다음:/ })).not.toBeInTheDocument()

    await user.click(within(pager).getByRole('button', { name: '이전: 판독' }))
    expect(within(pager).getByText('2 / 3 · 판독')).toBeInTheDocument()
  })

  it('공격과 정상의 크기를 실제 비율 그대로 그리고, 보이지 않는 값은 글로 알린다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '예시로 바로 보기' }))

    const attacks = screen.getByRole('img', { name: /공격 220,788건 가운데 탐지 160건, 0.072%. 미탐 220,628건./ })
    expect(attacks.querySelector('.scale-row__fill')).toHaveAttribute('width', (160 / 220788 * 100).toString())
    expect(screen.getByRole('img', { name: /정상 375,518건 가운데 오탐 86건, 0.023%. 정상으로 판정 375,432건./ })).toBeInTheDocument()
    expect(screen.getByText(/막대에서 거의 보이지 않는 값이 있습니다/)).toHaveTextContent('공격 탐지 160건, 정상 오탐 86건')
    expect(screen.getByText(/합격선이나 다른 제품과의 비교가 아닙니다/)).toBeInTheDocument()
  })

  it('잘못 적은 칸은 장을 옮기기 전에 브리핑에서 알린다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '숫자로 직접 입력' }))
    await user.selectOptions(screen.getByLabelText('지표 1'), 'accuracy')
    await user.type(screen.getByLabelText('값 (0부터 1 사이)'), '99')
    await user.click(screen.getByRole('button', { name: /검토 결과/ }))
    expect(document.querySelector('.investigation-brief__warn')).toHaveTextContent('잘못 적은 칸 1개는 계산에서 뺐습니다')
  })
})
