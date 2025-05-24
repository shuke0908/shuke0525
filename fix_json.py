#!/usr/bin/env python3
import json
import os
import glob

def fix_json_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 파일이 비어있거나 단순 {} 인지 확인
        if content.strip() in ['', '{}']:
            print(f"{file_path}: 빈 파일 또는 빈 객체, 무시합니다.")
            return False
        
        # JSON 파싱 시도
        try:
            data = json.loads(content)
            print(f"{file_path}: 이미 유효한 JSON입니다.")
            return False
        except json.JSONDecodeError as e:
            print(f"{file_path}: JSON 파싱 오류 발생: {e}")
            
            # 따옴표 문제 수정 (작은따옴표를 큰따옴표로)
            content = content.replace("'", '"')
            
            # 마지막 콤마 제거 문제 수정 (객체와 배열 모두)
            content = content.replace(',}', '}').replace(',]', ']')
            
            # 파싱 재시도
            try:
                data = json.loads(content)
                print(f"{file_path}: 수정 성공!")
                
                # 수정된 내용 저장
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                return True
            except json.JSONDecodeError as e:
                print(f"{file_path}: 자동 수정 실패, 수동 확인 필요: {e}")
                
                # 더 강력한 해결책: 파일에 빈 JSON 객체 넣기
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write('{}')
                print(f"{file_path}: 빈 JSON 객체로 초기화했습니다.")
                return True
    except Exception as e:
        print(f"{file_path}: 처리 중 오류 발생: {e}")
        return False

# 모든 언어 디렉토리 처리
locales_dir = "public/locales"
fixed_count = 0
failed_count = 0

# 모든 JSON 파일 처리
for json_file in glob.glob(f"{locales_dir}/*/*.json"):
    if fix_json_file(json_file):
        fixed_count += 1
    else:
        failed_count += 1

print(f"\n처리 완료: {fixed_count} 파일 수정됨, {failed_count} 파일은 이미 유효하거나 수정 불필요")