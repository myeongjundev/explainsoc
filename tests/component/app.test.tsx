import { render, screen, within } from '@testing-library/react'
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
    expect(screen.getByRole('heading', { level: 1, name: '그 99%, 무엇을 시험한 점수입니까?' })).toBeInTheDocument()
    expect(
      screen.getByText(
        '보안 AI 도입을 처음 맡은 담당자가 성능표에서 빠진 평가 조건을 찾고, 공급자에게 물을 질문을 논문 근거와 함께 준비하도록 돕습니다.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === `반영한 논문 · ${PAPER.title}`)).toBeInTheDocument()
    expect(screen.getByText(/입력한 성능 자료는 브라우저 메모리에서만 계산됩니다/)).toBeInTheDocument()
    expect(screen.getByText(/논문 값이 채워진 예시로 결과부터 봅니다/)).toBeInTheDocument()
    expect(screen.getByText('검토 파일 열기')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '논문 예시로 60초 검토' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '내 성능표 검토' })).toBeInTheDocument()
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

describe('논문 예시로 60초 검토', () => {
  it('결과로 바로 가서 R04와 그 질문을 보여 준다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '논문 예시로 60초 검토' }))
    expect(screen.getByRole('heading', { level: 2, name: '3. PoC 검토 작업대' })).toHaveFocus()
    expect(screen.getByText(/R04/)).toBeInTheDocument()
    const questions = screen.getByRole('region', { name: '공급자에게 물을 질문' })
    expect(within(questions).getByText('같은 시험에서 공격 Recall은 얼마입니까?')).toHaveClass('question-card__text')
    expect(document.querySelector('.baseline__delta')).toHaveTextContent('74건(탐지 160 − 오탐 86)')
  })

  it('정확한 P09 원수치와 두 주장 지표를 넣는다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '논문 예시로 60초 검토' }))
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
    await user.click(screen.getByRole('button', { name: '논문 예시로 60초 검토' }))
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
    await user.click(screen.getByRole('button', { name: '내 성능표 검토' }))
    expect(screen.getByLabelText('값 (0부터 1 사이)')).toBeDisabled()
    expect(screen.getByText(MESSAGES.metricKindMissing)).toBeInTheDocument()
  })

  it('오류는 보이는 label의 칸에 연결되고 무엇을 고칠지 말한다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '내 성능표 검토' }))
    await user.selectOptions(screen.getByLabelText('지표 1'), 'accuracy')
    const value = screen.getByLabelText('값 (0부터 1 사이)')
    await user.type(value, '99')
    expect(value).toHaveAttribute('aria-invalid', 'true')
    expect(value).toHaveAccessibleDescription(MESSAGES.ratioAboveOne)
  })

  it('잘못된 입력 하나가 다른 유효한 입력의 결과를 막지 않는다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '내 성능표 검토' }))
    await user.selectOptions(screen.getByLabelText('지표 1'), 'accuracy')
    await user.type(screen.getByLabelText('값 (0부터 1 사이)'), 'abc')
    await user.click(screen.getByRole('button', { name: '지표 하나 더' }))
    await user.selectOptions(screen.getByLabelText('지표 2'), 'fpr')
    await user.type(screen.getAllByLabelText('값 (0부터 1 사이)')[1], '0.001')
    await user.click(screen.getByRole('button', { name: /PoC 검토표/ }))
    expect(screen.getByText(/R04/)).toBeInTheDocument()
    expect(screen.queryByText(/R03/)).not.toBeInTheDocument()
    expect(screen.getByText('잘못 적은 칸 1개는 계산에서 뺐습니다. 입력 수정에서 고칠 수 있습니다.')).toBeInTheDocument()
  })

  it('혼동행렬의 합이 0이면 계산하지 않고 이유를 말한다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '내 성능표 검토' }))
    await user.click(screen.getByRole('button', { name: '혼동행렬로 입력' }))
    for (const label of [/\(TN\)/, /\(FP\)/, /\(FN\)/, /\(TP\)/]) await user.type(screen.getByLabelText(label), '0')
    expect(screen.getByText(MESSAGES.matrixEmpty)).toBeInTheDocument()
  })

  it('혼동행렬에 음수나 글자를 넣으면 그 칸에만 오류를 보인다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '내 성능표 검토' }))
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
    await user.click(screen.getByRole('button', { name: '내 성능표 검토' }))
    await user.click(screen.getByRole('button', { name: '다음: 평가 조건' }))
    const group = screen.getByRole('group', { name: '2. 시험에 학습 때 없던 공격이 들어 있었습니까?' })
    const radios = within(group).getAllByRole('radio')
    expect(radios.map((r) => (r as HTMLInputElement).value)).toEqual(['yes', 'no', 'unknown'])
    await user.click(within(group).getByLabelText('모름'))
    expect(within(group).getByLabelText('모름')).toBeChecked()
  })

  it('아무것도 고르지 않고 결과로 가도 질문 세 개가 나온다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '내 성능표 검토' }))
    await user.click(screen.getByRole('button', { name: /PoC 검토표/ }))
    const questions = screen.getByRole('region', { name: '공급자에게 물을 질문' })
    expect(within(questions).getAllByRole('listitem')).toHaveLength(3)
  })
})

describe('질문 복사', () => {
  it('질문 문장만 복사하고 입력한 숫자는 담지 않는다', async () => {
    const { user } = setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    await user.click(screen.getByRole('button', { name: '내 성능표 검토' }))
    await user.selectOptions(screen.getByLabelText('지표 1'), 'accuracy')
    await user.type(screen.getByLabelText('값 (0부터 1 사이)'), '0.8765')
    await user.click(screen.getByRole('button', { name: /PoC 검토표/ }))
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
    await user.click(screen.getByRole('button', { name: '논문 예시로 60초 검토' }))
    await user.click(screen.getByRole('button', { name: '질문만 복사' }))
    expect(await screen.findByText('복사하지 못했습니다. 질문 목록을 선택해 두었으니 직접 복사해 주세요.')).toBeInTheDocument()
  })
})

describe('PoC 미팅 산출물', () => {
  it('질문 상태와 메모를 검토표에 포함해 복사한다', async () => {
    const { user } = setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    await user.click(screen.getByRole('button', { name: '논문 예시로 60초 검토' }))
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
    await user.click(screen.getByRole('button', { name: '논문 예시로 60초 검토' }))
    await user.click(screen.getByRole('button', { name: '입력 수정' }))
    await user.click(screen.getByRole('button', { name: '혼동행렬 닫기' }))
    await user.click(screen.getByRole('button', { name: '혼동행렬로 입력' }))
    await user.click(screen.getByRole('button', { name: /PoC 검토표/ }))
    expect(document.querySelector('.reveal__scope')).toHaveTextContent('CICIDS2017')
    expect(document.querySelector('.step-source')).toHaveTextContent('논문 예시 A')
  })
})
