cmake_minimum_required(VERSION 3.10)
project(TogetherBackend)

# C++17 표준 사용 (현대적인 C++ 기능 사용 위함)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 멀티스레딩 지원 (httplib에서 사용)
find_package(Threads REQUIRED)

# 실행 파일 생성 (main.cpp를 빌드하여 server.exe 생성)
add_executable(server main.cpp)

# 멀티스레드 라이브러리 링크
target_link_libraries(server PRIVATE Threads::Threads)

# Windows의 경우 Winsock2 링크 필요 (httplib)
if(WIN32)
    target_link_libraries(server PRIVATE ws2_32 crypt32)
endif()
